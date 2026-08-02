/**
 * flow: tenant-admin
 * route: /admin/catalog/combine
 *
 * Catalog authorship shift: Tenant Admin never touches Templates directly —
 * they pick from CSP-published Templates and combine one into a tenant-scoped
 * CatalogItem with org defaults pre-filled for their own users. CSP Admin no
 * longer authors CatalogItems (see retired ProviderCatalogItemNewPage/EditPage).
 *
 * Editable fields are driven entirely by the selected Template's own
 * `parameters[]` (the API's contract for what's configurable) rather than a
 * hardcoded per-kind field list — see catalogFieldDefinition.ts.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  PageSection,
  Stack,
  StackItem,
  TextArea,
  TextInput,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import TrashIcon from '@patternfly/react-icons/dist/esm/icons/trash-icon';

import { useCreateBareMetalInstanceCatalogItem } from '../../api/v1/baremetal-instance-catalog-item';
import { useBareMetalInstanceTemplates } from '../../api/v1/baremetal-instance-templates';
import { useTenantRateOverrides } from '../../api/v1/billing-tenant';
import { useCreateClusterCatalogItem } from '../../api/v1/cluster-catalog-item';
import { useClusterTemplates } from '../../api/v1/cluster-templates';
import { useCreateComputeInstanceCatalogItem } from '../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplates } from '../../api/v1/compute-instance-templates';
import {
  BILLABLE_COMPONENTS_KEY,
  isTemplateAllowedForTenant,
  isTemplatePublished,
  readBillableComponents,
  totalHourlyRate,
} from '../../api/v1/template-billing';
import { PriceBreakdown } from '../../components/catalog/PriceBreakdown';
import {
  type CatalogFieldDefinition,
  customFieldPathFromKey,
} from '../../components/catalogProvision/catalogFieldDefinition';
import { CUSTOM_FIELD_API_SOURCES } from '../../components/catalogProvision/customFieldApiSources';
import { DynamicFieldValueInput } from '../../components/catalogProvision/wizard/DynamicFieldValueInput';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

// The demo tenant ID — in production this comes from the auth token / session
const DEMO_TENANT_ID = 'tenant-001';

type CombineKind = 'vm' | 'cluster' | 'baremetal';

/** google.protobuf.*Value type URL (from TemplateParameterDefinition.type) → JSON Schema primitive. */
const PROTO_TYPE_TO_SCHEMA_TYPE: Record<string, string> = {
  'google.protobuf.Int32Value': 'integer',
  'google.protobuf.Int64Value': 'integer',
  'google.protobuf.FloatValue': 'number',
  'google.protobuf.DoubleValue': 'number',
  'google.protobuf.StringValue': 'string',
  'google.protobuf.BoolValue': 'boolean',
};

interface TemplateParameter {
  name: string;
  title?: string;
  description?: string;
  required?: boolean;
  type?: string;
}

interface AnyTemplate {
  id: string;
  metadata?: {
    name?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  title: string;
  description?: string;
  parameters?: TemplateParameter[];
  specDefaults?: unknown;
  nodeSets?: Record<string, { hostType?: string; size?: number }>;
}

const isMultilineField = (path: string): boolean =>
  path.includes('ssh') || path.includes('pull_secret') || path.includes('user_data');

/** Maps the Template's own `parameters[]` (the API contract for what's configurable) to CatalogFieldDefinitions. */
const templateParametersToFieldDefs = (params: TemplateParameter[]): CatalogFieldDefinition[] =>
  params.map((p) => {
    const shortType = (p.type ?? '').split('/').pop() ?? '';
    const schemaType = PROTO_TYPE_TO_SCHEMA_TYPE[shortType];
    return {
      path: `template_parameters.${p.name}`,
      displayName: p.title || p.name,
      editable: true,
      ...(p.description ? { description: p.description } : {}),
      ...(p.required !== undefined ? { required: p.required } : {}),
      ...(p.required && schemaType === 'string'
        ? { validationSchema: { type: schemaType, minLength: 1 } }
        : schemaType
          ? { validationSchema: { type: schemaType } }
          : {}),
    };
  });

/** Locked reference field showing what the Template pins, purely informational (not sent to the API). */
const lockedSummaryFromTemplate = (
  kind: CombineKind,
  template: AnyTemplate,
): Array<{ label: string; value: string }> => {
  if (kind === 'vm') {
    const sd = template.specDefaults as
      | { instanceType?: string; image?: { sourceRef?: string } }
      | undefined;
    const rows: Array<{ label: string; value: string }> = [];
    if (sd?.instanceType) {
      rows.push({ label: 'Instance type', value: sd.instanceType });
    }
    if (sd?.image?.sourceRef) {
      rows.push({ label: 'Image', value: sd.image.sourceRef });
    }
    return rows;
  }
  if (kind === 'baremetal') {
    const sd = template.specDefaults as { hostType?: string } | undefined;
    return sd?.hostType ? [{ label: 'Host type', value: sd.hostType }] : [];
  }
  const nodeSets = template.nodeSets ?? {};
  return Object.entries(nodeSets).map(([name, ns]) => ({
    label: `Node set: ${name}`,
    value: `${ns.hostType ?? '—'} ×${ns.size ?? 0}`,
  }));
};

const schemaTypeOf = (def: CatalogFieldDefinition): string | undefined =>
  typeof def.validationSchema?.type === 'string' ? def.validationSchema.type : undefined;

type CustomFieldValueKind = 'text' | 'number' | 'boolean' | 'api';

/** A brand-new field the Tenant Admin is authoring — not derived from the template. */
interface CustomFieldDraft {
  id: string;
  key: string;
  displayName: string;
  valueKind: CustomFieldValueKind;
  apiPath: string;
  required: boolean;
  editable: boolean;
  defaultValue: string;
}

const createEmptyCustomFieldDraft = (): CustomFieldDraft => ({
  id: `cf-${Math.random().toString(36).slice(2)}`,
  key: '',
  displayName: '',
  valueKind: 'text',
  apiPath: '',
  required: false,
  editable: true,
  defaultValue: '',
});

const slugifyCustomFieldKey = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

/** Builds a preview CatalogFieldDefinition from a draft so its default-value control
 * (DynamicFieldValueInput) renders with the right type/API-source before the field is saved. */
const customFieldDraftToPreviewDef = (draft: CustomFieldDraft): CatalogFieldDefinition => ({
  path: customFieldPathFromKey(slugifyCustomFieldKey(draft.key) || draft.id),
  displayName: draft.displayName || draft.key || 'Value',
  editable: true,
  ...(draft.valueKind === 'api' && draft.apiPath ? { sourceApiPath: draft.apiPath } : {}),
  ...(draft.valueKind === 'number' ? { validationSchema: { type: 'number' } } : {}),
  ...(draft.valueKind === 'boolean' ? { validationSchema: { type: 'boolean' } } : {}),
});

export const TenantCombineTemplatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const effectiveTenantId = tenantId || DEMO_TENANT_ID;
  const [kind, setKind] = useState<CombineKind>('vm');
  const [selected, setSelected] = useState<AnyTemplate | null>(null);

  const { rateOverrides } = useTenantRateOverrides(effectiveTenantId);

  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();

  const isCombinable = (t: AnyTemplate) =>
    isTemplatePublished(t) && isTemplateAllowedForTenant(t, effectiveTenantId);

  const publishedByKind: Record<CombineKind, AnyTemplate[]> = {
    vm: vmTemplates.filter(isCombinable),
    cluster: clTemplates.filter(isCombinable),
    baremetal: bmTemplates.filter(isCombinable),
  };

  const templatesForKind = publishedByKind[kind];

  const [title, setTitle] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const createVm = useCreateComputeInstanceCatalogItem();
  const createCluster = useCreateClusterCatalogItem();
  const createBm = useCreateBareMetalInstanceCatalogItem();
  const mutationError =
    kind === 'vm' ? createVm.error : kind === 'cluster' ? createCluster.error : createBm.error;

  const editableFields = useMemo(
    () => templateParametersToFieldDefs(selected?.parameters ?? []),
    [selected],
  );
  const billableComponents = useMemo(
    () => (selected ? readBillableComponents(selected) : []),
    [selected],
  );
  const lockedSummary = useMemo(
    () => (selected ? lockedSummaryFromTemplate(kind, selected) : []),
    [kind, selected],
  );

  /** Non-empty drafts only — a fully blank trailing row is not treated as an error. */
  const activeCustomFieldDrafts = useMemo(
    () => customFields.filter((f) => f.key.trim() || f.displayName.trim()),
    [customFields],
  );

  const customFieldValidationError = useMemo(() => {
    const seenKeys = new Set<string>();
    for (const draft of activeCustomFieldDrafts) {
      const slug = slugifyCustomFieldKey(draft.key);
      if (!slug) {
        return t('Each custom field needs a key.');
      }
      if (seenKeys.has(slug)) {
        return t('Custom field keys must be unique.');
      }
      seenKeys.add(slug);
      if (draft.valueKind === 'api' && !draft.apiPath) {
        return t('Choose an API source for each "Choose from API" field.');
      }
    }
    return null;
  }, [activeCustomFieldDrafts, t]);

  const selectTemplate = (t: AnyTemplate) => {
    setSelected(t);
    setTitle(`${t.title || t.metadata?.name || t.id} — Org default`);
    const init: Record<string, string> = {};
    for (const def of templateParametersToFieldDefs(t.parameters ?? [])) {
      if (def.default !== undefined) {
        init[def.path] = String(def.default);
      }
    }
    setOverrides(init);
    setCustomFields([]);
  };

  const addCustomField = () => setCustomFields((prev) => [...prev, createEmptyCustomFieldDraft()]);

  const removeCustomField = (id: string) =>
    setCustomFields((prev) => prev.filter((f) => f.id !== id));

  const updateCustomField = (id: string, patch: Partial<CustomFieldDraft>) =>
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleCreate = async () => {
    if (!selected || !title.trim() || customFieldValidationError) {
      return;
    }
    setSaving(true);
    createVm.reset();
    createCluster.reset();
    createBm.reset();
    try {
      const mergedFieldDefs = editableFields.map((def) => ({
        path: def.path,
        display_name: def.displayName,
        editable: def.editable,
        ...(overrides[def.path] !== undefined ? { default: overrides[def.path] } : {}),
        ...(def.validationSchema
          ? { validation_schema: JSON.stringify(def.validationSchema) }
          : {}),
      }));

      const customFieldDefs = activeCustomFieldDrafts.map((draft) => {
        const slug = slugifyCustomFieldKey(draft.key);
        const validationSchema =
          draft.valueKind === 'number'
            ? { type: 'number' }
            : draft.valueKind === 'boolean'
              ? { type: 'boolean' }
              : undefined;
        const trimmedDefault = draft.defaultValue.trim();
        const defaultValue: unknown =
          trimmedDefault === ''
            ? undefined
            : draft.valueKind === 'boolean'
              ? trimmedDefault === 'true'
              : trimmedDefault;
        return {
          path: customFieldPathFromKey(slug),
          display_name: draft.displayName.trim() || slug,
          editable: draft.editable,
          required: draft.required,
          ...(defaultValue !== undefined ? { default: defaultValue } : {}),
          ...(validationSchema ? { validation_schema: JSON.stringify(validationSchema) } : {}),
          ...(draft.valueKind === 'api' && draft.apiPath ? { source_api_path: draft.apiPath } : {}),
        };
      });

      // Snapshot the effective hourly price (template base rate + tenant's plan
      // overrides) onto the catalog item so it survives even if the plan later
      // changes — see Price Snapshotting in BillingArchDiagram.
      const hourly = totalHourlyRate(billableComponents, rateOverrides);
      const labels = { ...(selected.metadata?.labels ?? {}) };
      if (hourly > 0) {
        labels['price_per_hour'] = hourly.toFixed(4);
      }

      const body = {
        metadata: {
          name: title
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          labels,
          annotations:
            billableComponents.length > 0
              ? { [BILLABLE_COMPONENTS_KEY]: JSON.stringify(billableComponents) }
              : {},
        },
        title: title.trim(),
        description: selected.description ?? '',
        template: selected.metadata?.name ?? selected.id,
        published: true,
        tenant: effectiveTenantId,
        field_definitions: [...mergedFieldDefs, ...customFieldDefs],
      };

      if (kind === 'vm') {
        await createVm.mutateAsync(body as unknown as Parameters<typeof createVm.mutateAsync>[0]);
      } else if (kind === 'cluster') {
        await createCluster.mutateAsync(
          body as unknown as Parameters<typeof createCluster.mutateAsync>[0],
        );
      } else {
        await createBm.mutateAsync(body as unknown as Parameters<typeof createBm.mutateAsync>[0]);
      }
      navigate('/admin/catalog');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/catalog')}>
                {t('Catalog — Admin')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Combine template')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Combine a published template')}
          </Title>
          <Content component="p">
            {t(
              "Pick a CSP-published template and pre-fill your organization's defaults. The resulting catalog item is visible only to your tenant.",
            )}
          </Content>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        {!selected ? (
          <Stack hasGutter>
            <ToggleGroup aria-label={t('Template kind')}>
              <ToggleGroupItem
                text={t('VM')}
                buttonId="combine-vm"
                isSelected={kind === 'vm'}
                onChange={() => setKind('vm')}
              />
              <ToggleGroupItem
                text={t('Cluster')}
                buttonId="combine-cluster"
                isSelected={kind === 'cluster'}
                onChange={() => setKind('cluster')}
              />
              <ToggleGroupItem
                text={t('Bare Metal')}
                buttonId="combine-bm"
                isSelected={kind === 'baremetal'}
                onChange={() => setKind('baremetal')}
              />
            </ToggleGroup>

            {templatesForKind.length === 0 ? (
              <Alert
                variant="info"
                isInline
                title={t(
                  'No published templates of this kind yet. Ask your CSP admin to publish one.',
                )}
              />
            ) : (
              <Grid hasGutter>
                {templatesForKind.map((tpl) => (
                  <GridItem key={tpl.id} span={4}>
                    <Card isFullHeight isClickable>
                      <CardTitle>{tpl.title || tpl.metadata?.name || tpl.id}</CardTitle>
                      <CardBody>
                        <Content component="small">
                          {tpl.description || t('No description.')}
                        </Content>
                        <div style={{ marginTop: '0.75rem' }}>
                          <Button variant="secondary" size="sm" onClick={() => selectTemplate(tpl)}>
                            {t('Combine into catalog item')}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            )}
          </Stack>
        ) : (
          <Stack hasGutter>
            <Content>
              <p>
                {t('Creating an org-scoped catalog item from')} <strong>{selected.title}</strong>.
              </p>
            </Content>

            <Form>
              <FormGroup label={t('Catalog item title')} fieldId="ctp-title" isRequired>
                <TextInput
                  id="ctp-title"
                  value={title}
                  onChange={(_e, v) => setTitle(v)}
                  isRequired
                />
              </FormGroup>
            </Form>

            <PriceBreakdown components={billableComponents} rateOverrides={rateOverrides} />

            {lockedSummary.length > 0 && (
              <>
                <Divider />
                <Title headingLevel="h3" size="md">
                  {t('Inherited from template (locked)')}
                </Title>
                <DescriptionList isHorizontal isCompact>
                  {lockedSummary.map((row) => (
                    <DescriptionListGroup key={row.label}>
                      <DescriptionListTerm>{row.label}</DescriptionListTerm>
                      <DescriptionListDescription>{row.value}</DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              </>
            )}

            <Divider />
            <Title headingLevel="h3" size="md">
              {t('Organization defaults')}
            </Title>

            {editableFields.length === 0 ? (
              <Alert
                variant="info"
                isInline
                title={t(
                  'This template has no configurable parameters. Only the catalog item title and pricing are needed.',
                )}
              />
            ) : (
              <>
                <Content component="small">
                  {t(
                    'Pre-filled for your team members; they can still override at provision time.',
                  )}
                </Content>
                <Form>
                  {editableFields.map((def) => {
                    const schemaType = schemaTypeOf(def);
                    const isBoolean = schemaType === 'boolean';
                    const isNumeric = schemaType === 'integer' || schemaType === 'number';
                    const fieldId = `ctp-field-${def.path}`;
                    const helperId = `${fieldId}-helper`;
                    return (
                      <FormGroup
                        key={def.path}
                        label={def.displayName}
                        fieldId={fieldId}
                        isRequired={Boolean(def.required)}
                      >
                        {isBoolean ? (
                          <Checkbox
                            id={fieldId}
                            label={def.displayName}
                            isChecked={overrides[def.path] === 'true'}
                            onChange={(_e, v) =>
                              setOverrides((prev) => ({ ...prev, [def.path]: String(v) }))
                            }
                            aria-describedby={helperId}
                          />
                        ) : isMultilineField(def.path) ? (
                          <TextArea
                            id={fieldId}
                            value={overrides[def.path] ?? ''}
                            onChange={(_e, v) =>
                              setOverrides((prev) => ({ ...prev, [def.path]: v }))
                            }
                            rows={3}
                            aria-describedby={helperId}
                          />
                        ) : (
                          <TextInput
                            id={fieldId}
                            type={isNumeric ? 'number' : 'text'}
                            value={overrides[def.path] ?? ''}
                            onChange={(_e, v) =>
                              setOverrides((prev) => ({ ...prev, [def.path]: v }))
                            }
                            aria-describedby={helperId}
                          />
                        )}
                        {(def.description || schemaType) && (
                          <FormHelperText>
                            <HelperText id={helperId}>
                              {def.description && (
                                <HelperTextItem>{def.description}</HelperTextItem>
                              )}
                              {schemaType && (
                                <HelperTextItem variant="default">
                                  {def.required
                                    ? t('Type: {{type}} · Required', { type: schemaType })
                                    : t('Type: {{type}} · Optional', { type: schemaType })}
                                </HelperTextItem>
                              )}
                            </HelperText>
                          </FormHelperText>
                        )}
                      </FormGroup>
                    );
                  })}
                </Form>
              </>
            )}

            <Divider />
            <Title headingLevel="h3" size="md">
              {t('Custom fields')}
            </Title>
            <Content component="small">
              {t(
                "Define fields beyond the template's own parameters — e.g. a rack zone picked from an API list. Visible to your team members when they provision from this catalog item.",
              )}
            </Content>

            <Stack hasGutter>
              {customFields.map((draft) => {
                const previewDef = customFieldDraftToPreviewDef(draft);
                const rowFieldId = `ctp-custom-field-${draft.id}`;
                return (
                  <StackItem key={draft.id}>
                    <Card isCompact>
                      <CardBody>
                        <Grid hasGutter>
                          <GridItem span={3}>
                            <FormGroup label={t('Field key')} fieldId={`${rowFieldId}-key`} isRequired>
                              <TextInput
                                id={`${rowFieldId}-key`}
                                value={draft.key}
                                onChange={(_e, v) => updateCustomField(draft.id, { key: v })}
                                placeholder={t('rack_zone')}
                              />
                            </FormGroup>
                          </GridItem>
                          <GridItem span={3}>
                            <FormGroup label={t('Display name')} fieldId={`${rowFieldId}-name`}>
                              <TextInput
                                id={`${rowFieldId}-name`}
                                value={draft.displayName}
                                onChange={(_e, v) => updateCustomField(draft.id, { displayName: v })}
                                placeholder={t('Rack zone')}
                              />
                            </FormGroup>
                          </GridItem>
                          <GridItem span={3}>
                            <FormGroup label={t('Value type')} fieldId={`${rowFieldId}-kind`}>
                              <FormSelect
                                id={`${rowFieldId}-kind`}
                                value={draft.valueKind}
                                onChange={(_e, v) =>
                                  updateCustomField(draft.id, {
                                    valueKind: v as CustomFieldValueKind,
                                    defaultValue: '',
                                    apiPath: v === 'api' ? draft.apiPath : '',
                                  })
                                }
                              >
                                <FormSelectOption value="text" label={t('Text')} />
                                <FormSelectOption value="number" label={t('Number')} />
                                <FormSelectOption value="boolean" label={t('Boolean')} />
                                <FormSelectOption value="api" label={t('Choose from API')} />
                              </FormSelect>
                            </FormGroup>
                          </GridItem>
                          <GridItem span={3}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                              <Button
                                variant="plain"
                                aria-label={t('Remove field')}
                                icon={<TrashIcon />}
                                onClick={() => removeCustomField(draft.id)}
                              />
                            </div>
                          </GridItem>

                          {draft.valueKind === 'api' && (
                            <GridItem span={3}>
                              <FormGroup label={t('Value source')} fieldId={`${rowFieldId}-source`} isRequired>
                                <FormSelect
                                  id={`${rowFieldId}-source`}
                                  value={draft.apiPath}
                                  onChange={(_e, v) => updateCustomField(draft.id, { apiPath: v })}
                                >
                                  <FormSelectOption value="" label={t('Select a value')} isPlaceholder isDisabled />
                                  {CUSTOM_FIELD_API_SOURCES.map((source) => (
                                    <FormSelectOption
                                      key={source.path}
                                      value={source.path}
                                      label={source.label}
                                    />
                                  ))}
                                </FormSelect>
                              </FormGroup>
                            </GridItem>
                          )}

                          <GridItem span={3}>
                            <FormGroup label={t('Default value')} fieldId={`${rowFieldId}-default`}>
                              <DynamicFieldValueInput
                                def={previewDef}
                                value={draft.defaultValue}
                                onChange={(v) => updateCustomField(draft.id, { defaultValue: v })}
                                fieldId={`${rowFieldId}-default`}
                              />
                            </FormGroup>
                          </GridItem>

                          <GridItem span={3}>
                            <Checkbox
                              id={`${rowFieldId}-required`}
                              label={t('Required')}
                              isChecked={draft.required}
                              onChange={(_e, v) => updateCustomField(draft.id, { required: v })}
                            />
                          </GridItem>
                          <GridItem span={3}>
                            <Checkbox
                              id={`${rowFieldId}-editable`}
                              label={t('Editable')}
                              isChecked={draft.editable}
                              onChange={(_e, v) => updateCustomField(draft.id, { editable: v })}
                            />
                          </GridItem>
                        </Grid>
                      </CardBody>
                    </Card>
                  </StackItem>
                );
              })}
              <StackItem>
                <Button variant="link" isInline onClick={addCustomField}>
                  {t('+ Add custom field')}
                </Button>
              </StackItem>
            </Stack>

            {customFieldValidationError && (
              <Alert variant="warning" isInline title={customFieldValidationError} />
            )}

            {Boolean(mutationError) && (
              <Alert variant="danger" isInline title={t('Failed to create catalog item')}>
                {getErrorMessage(mutationError)}
              </Alert>
            )}

            <ActionGroup>
              <Button
                variant="primary"
                onClick={handleCreate}
                isLoading={saving}
                isDisabled={saving || !title.trim() || Boolean(customFieldValidationError)}
              >
                {t('Create catalog item')}
              </Button>
              <Button variant="link" onClick={() => setSelected(null)} isDisabled={saving}>
                {t('Back to templates')}
              </Button>
            </ActionGroup>
          </Stack>
        )}
      </PageSection>
    </>
  );
};

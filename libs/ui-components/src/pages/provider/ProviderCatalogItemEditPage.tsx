/**
 * flow: provider-admin
 * route: /provider/catalog/:id/edit?kind=vm|cluster|baremetal|maas
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  Label,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Split,
  SplitItem,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import {
  useAllBareMetalInstanceCatalogItems,
  usePatchBareMetalInstanceCatalogItem,
} from '../../api/v1/baremetal-instance-catalog-item';
import { useBareMetalInstanceTemplates } from '../../api/v1/baremetal-instance-templates';
import {
  useClusterCatalogItem,
  usePatchClusterCatalogItem,
} from '../../api/v1/cluster-catalog-item';
import { useClusterTemplates } from '../../api/v1/cluster-templates';
import {
  useComputeInstanceCatalogItem,
  usePatchComputeInstanceCatalogItem,
} from '../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplates } from '../../api/v1/compute-instance-templates';
import { useMaaSCatalogItem, usePatchMaaSCatalogItem } from '../../api/v1/maas-catalog-item';
import { useTenants } from '../../api/v1/tenant';
import type {
  CatalogItemForDisplay,
  CatalogItemKind,
} from '../../components/catalog/catalogItemDisplay';
import { catalogItemFieldDefinitions } from '../../components/catalogProvision/catalogFieldDefinition';
import { getErrorMessage } from '../../utils/error';

type ItemType = 'vm' | 'cluster' | 'baremetal' | 'maas';

interface FieldDefRow {
  path: string;
  displayName: string;
  editable: boolean;
}

const KIND_LABELS: Record<ItemType, string> = {
  vm: 'Virtual Machine',
  cluster: 'Cluster',
  baremetal: 'Bare Metal',
  maas: 'AI Model (MaaS)',
};

const BACK = '/provider/catalog';

export const ProviderCatalogItemEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const kind = (searchParams.get('kind') ?? 'vm') as CatalogItemKind;
  const itemType = kind === 'baremetal' ? 'baremetal' : (kind as ItemType);

  // Fetch existing item
  const { data: vmItem, isLoading: vmLoading } = useComputeInstanceCatalogItem(
    kind === 'vm' ? id : undefined,
  );
  const { data: clItem, isLoading: clLoading } = useClusterCatalogItem(
    kind === 'cluster' ? id : undefined,
  );
  const { data: bmItems = [], isLoading: bmLoading } = useAllBareMetalInstanceCatalogItems(
    kind === 'baremetal' ? {} : (undefined as never),
  );
  const { data: maasItem, isLoading: maasLoading } = useMaaSCatalogItem(
    kind === 'maas' ? id : undefined,
  );

  const bmItem = kind === 'baremetal' ? bmItems.find((i) => i.id === id) : undefined;
  const existingRaw: CatalogItemForDisplay | undefined =
    kind === 'vm'
      ? (vmItem as CatalogItemForDisplay | undefined)
      : kind === 'cluster'
        ? (clItem as CatalogItemForDisplay | undefined)
        : kind === 'baremetal'
          ? (bmItem as CatalogItemForDisplay | undefined)
          : (maasItem as CatalogItemForDisplay | undefined);

  const isLoading =
    kind === 'vm'
      ? vmLoading
      : kind === 'cluster'
        ? clLoading
        : kind === 'baremetal'
          ? bmLoading
          : maasLoading;

  // Templates
  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clusterTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();
  const { data: tenants = [] } = useTenants();

  // Form state
  const [templateId, setTemplateId] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [pricePerHour, setPricePerHour] = useState('');
  const [osLabel, setOsLabel] = useState('');
  const [archLabel, setArchLabel] = useState('');
  const [modelProvider, setModelProvider] = useState('');
  const [contextWindow, setContextWindow] = useState('');
  const [pricePerInputToken, setPricePerInputToken] = useState('');
  const [pricePerOutputToken, setPricePerOutputToken] = useState('');
  const [workloadLabel, setWorkloadLabel] = useState('');
  const [fieldDefs, setFieldDefs] = useState<FieldDefRow[]>([]);
  const [allowedTenants, setAllowedTenants] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated && existingRaw) {
      const existing = existingRaw;
      setTemplateId(existing.template ?? '');
      setTitle(existing.title ?? '');
      setDescription(existing.description ?? '');
      setPublished(Boolean(existing.published));
      setPricePerHour(existing.metadata?.labels?.['price_per_hour'] ?? '');
      setOsLabel(existing.metadata?.labels?.['os'] ?? '');
      setArchLabel(existing.metadata?.labels?.['arch'] ?? '');
      setModelProvider(existing.metadata?.labels?.['model_provider'] ?? '');
      setContextWindow(existing.metadata?.labels?.['context_window'] ?? '');
      setPricePerInputToken(existing.metadata?.labels?.['price_per_input_token'] ?? '');
      setPricePerOutputToken(existing.metadata?.labels?.['price_per_output_token'] ?? '');
      setWorkloadLabel(existing.metadata?.labels?.['workload'] ?? '');
      const defs = catalogItemFieldDefinitions(existing);
      setFieldDefs(
        defs.length > 0
          ? defs.map((d) => ({ path: d.path, displayName: d.displayName, editable: d.editable }))
          : [{ path: 'ssh_public_key', displayName: 'SSH Public Key', editable: true }],
      );
      setAllowedTenants((existing as { allowed_tenants?: string[] }).allowed_tenants ?? []);
      setHydrated(true);
    }
  }, [existingRaw, hydrated]);

  const patchVm = usePatchComputeInstanceCatalogItem();
  const patchCl = usePatchClusterCatalogItem();
  const patchBm = usePatchBareMetalInstanceCatalogItem();
  const patchMaas = usePatchMaaSCatalogItem();

  const mutationError =
    itemType === 'vm'
      ? patchVm.error
      : itemType === 'cluster'
        ? patchCl.error
        : itemType === 'maas'
          ? patchMaas.error
          : patchBm.error;

  const templates =
    itemType === 'vm'
      ? vmTemplates
      : itemType === 'cluster'
        ? clusterTemplates
        : itemType === 'maas'
          ? []
          : bmTemplates;
  const selectedTemplate = templates.find((t) => t.id === templateId);

  const toggleTenant = (tid: string) =>
    setAllowedTenants((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid],
    );

  const addFieldDef = () =>
    setFieldDefs((prev) => [...prev, { path: '', displayName: '', editable: true }]);
  const removeFieldDef = (i: number) => setFieldDefs((prev) => prev.filter((_, idx) => idx !== i));
  const updateFieldDef = (i: number, field: keyof FieldDefRow, val: string | boolean) =>
    setFieldDefs((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const buildLabels = () => {
    const labels: Record<string, string> = {};
    if (itemType === 'maas') {
      if (modelProvider.trim()) {
        labels['model_provider'] = modelProvider.trim();
      }
      if (contextWindow.trim()) {
        labels['context_window'] = contextWindow.trim();
      }
      if (pricePerInputToken.trim()) {
        labels['price_per_input_token'] = pricePerInputToken.trim();
      }
      if (pricePerOutputToken.trim()) {
        labels['price_per_output_token'] = pricePerOutputToken.trim();
      }
      if (workloadLabel.trim()) {
        labels['workload'] = workloadLabel.trim();
      }
    } else {
      if (pricePerHour.trim()) {
        labels['price_per_hour'] = pricePerHour.trim();
      }
      if (osLabel.trim()) {
        labels['os'] = osLabel.trim();
      }
      if (archLabel.trim()) {
        labels['arch'] = archLabel.trim();
      }
      if (workloadLabel.trim()) {
        labels['workload'] = workloadLabel.trim();
      }
    }
    return labels;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !id) {
      return;
    }
    setIsPending(true);
    patchVm.reset();
    patchCl.reset();
    patchBm.reset();
    patchMaas.reset();
    try {
      const labels = buildLabels();
      const fieldDefinitions = fieldDefs
        .filter((f) => f.path.trim())
        .map((f) => ({
          path: f.path.trim(),
          display_name: f.displayName.trim(),
          editable: f.editable,
        }));
      const patch = {
        metadata: { labels },
        title: title.trim(),
        description: description.trim(),
        template: templateId || undefined,
        published,
        field_definitions: fieldDefinitions,
        allowed_tenants: allowedTenants,
      };
      if (itemType === 'vm') {
        await patchVm.mutateAsync({ id, patch: patch as never });
      } else if (itemType === 'cluster') {
        await patchCl.mutateAsync({ id, patch: patch as never });
      } else if (itemType === 'maas') {
        await patchMaas.mutateAsync({ id, patch: patch as never });
      } else {
        await patchBm.mutateAsync({ id, patch: patch as never });
      }
      navigate(BACK);
    } finally {
      setIsPending(false);
    }
  };

  if (isLoading || !hydrated) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading catalog item" />
      </PageSection>
    );
  }

  if (!existingRaw) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="danger" isInline title={`Catalog item "${id}" not found`} />
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                Global Catalog
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Edit — {existingRaw.title}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Edit catalog item
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '640px' }} id="cci-edit-form">
          <FormGroup label="Type" fieldId="cci-type">
            <Label color="blue">{KIND_LABELS[itemType]}</Label>
            <Content
              component="small"
              style={{
                display: 'block',
                marginTop: '0.25rem',
                color: 'var(--pf-t--global--color--nonstatus--gray--default)',
              }}
            >
              Type cannot be changed after creation.
            </Content>
          </FormGroup>

          <FormGroup label="Template" fieldId="cci-template">
            <Select
              isOpen={templateOpen}
              onOpenChange={setTemplateOpen}
              selected={templateId}
              onSelect={(_e, v) => {
                setTemplateId(v as string);
                setTemplateOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setTemplateOpen(!templateOpen)}
                  isExpanded={templateOpen}
                >
                  {selectedTemplate?.metadata?.name ?? 'Select template (optional)'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">None</SelectOption>
                {templates.map((t) => (
                  <SelectOption key={t.id} value={t.id}>
                    {t.metadata?.name ?? t.id}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Title" fieldId="cci-title" isRequired>
            <TextInput
              id="cci-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="cci-description">
            <TextArea
              id="cci-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Labels" fieldId="cci-labels">
            {itemType === 'maas' ? (
              <Split hasGutter>
                <SplitItem>
                  <TextInput
                    value={modelProvider}
                    onChange={(_e, v) => setModelProvider(v)}
                    placeholder="Provider (e.g. meta)"
                    aria-label="Model provider"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={contextWindow}
                    onChange={(_e, v) => setContextWindow(v)}
                    placeholder="Context window (e.g. 128k)"
                    aria-label="Context window"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={workloadLabel}
                    onChange={(_e, v) => setWorkloadLabel(v)}
                    placeholder="Workload"
                    aria-label="Workload label"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={pricePerInputToken}
                    onChange={(_e, v) => setPricePerInputToken(v)}
                    placeholder="$/input token"
                    aria-label="Price per input token"
                    type="number"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={pricePerOutputToken}
                    onChange={(_e, v) => setPricePerOutputToken(v)}
                    placeholder="$/output token"
                    aria-label="Price per output token"
                    type="number"
                  />
                </SplitItem>
              </Split>
            ) : (
              <Split hasGutter>
                <SplitItem>
                  <TextInput
                    value={osLabel}
                    onChange={(_e, v) => setOsLabel(v)}
                    placeholder="OS (e.g. rhel)"
                    aria-label="OS label"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={archLabel}
                    onChange={(_e, v) => setArchLabel(v)}
                    placeholder="Arch (e.g. x86_64)"
                    aria-label="Arch label"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={workloadLabel}
                    onChange={(_e, v) => setWorkloadLabel(v)}
                    placeholder="Workload"
                    aria-label="Workload label"
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={pricePerHour}
                    onChange={(_e, v) => setPricePerHour(v)}
                    placeholder="$/hr"
                    aria-label="Price per hour"
                    type="number"
                  />
                </SplitItem>
              </Split>
            )}
          </FormGroup>

          <FormGroup label="Field definitions" fieldId="cci-field-defs">
            {fieldDefs.map((row, i) => (
              <Split key={i} hasGutter style={{ marginBottom: 6 }}>
                <SplitItem>
                  <TextInput
                    value={row.path}
                    onChange={(_e, v) => updateFieldDef(i, 'path', v)}
                    placeholder="ssh_public_key"
                    aria-label="Field path"
                    style={{ width: 160 }}
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={row.displayName}
                    onChange={(_e, v) => updateFieldDef(i, 'displayName', v)}
                    placeholder="Display name"
                    aria-label="Display name"
                    style={{ width: 140 }}
                  />
                </SplitItem>
                <SplitItem>
                  <Checkbox
                    id={`fd-editable-${i}`}
                    label="Editable"
                    isChecked={row.editable}
                    onChange={(_e, v) => updateFieldDef(i, 'editable', v)}
                  />
                </SplitItem>
                <SplitItem>
                  <Button variant="plain" onClick={() => removeFieldDef(i)}>
                    ✕
                  </Button>
                </SplitItem>
              </Split>
            ))}
            <Button variant="link" onClick={addFieldDef}>
              + Add field
            </Button>
          </FormGroup>

          <FormGroup fieldId="cci-published">
            <Checkbox
              id="cci-published"
              label="Published (visible to tenants)"
              isChecked={published}
              onChange={(_e, v) => setPublished(v)}
            />
          </FormGroup>

          {tenants.length > 0 && (
            <FormGroup label="Restrict to specific tenants" fieldId="cci-tenants">
              {tenants.map((t) => (
                <Checkbox
                  key={t.id}
                  id={`cci-tenant-${t.id}`}
                  label={t.metadata?.name ?? t.id}
                  isChecked={allowedTenants.includes(t.id)}
                  onChange={() => toggleTenant(t.id)}
                  style={{ marginBottom: 4 }}
                />
              ))}
              {allowedTenants.length > 0 && (
                <Button variant="link" isInline onClick={() => setAllowedTenants([])}>
                  Clear (grant to all)
                </Button>
              )}
            </FormGroup>
          )}

          {mutationError && (
            <Alert variant="danger" title="Failed to update catalog item" isInline>
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="cci-edit-form"
              isLoading={isPending}
              isDisabled={isPending || !title.trim()}
            >
              Save
            </Button>
            <Button variant="link" onClick={() => navigate(BACK)} isDisabled={isPending}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};

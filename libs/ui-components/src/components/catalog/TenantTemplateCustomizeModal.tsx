import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';

import type { CatalogItemKind } from './catalogItemDisplay';
import { useCreateBareMetalInstanceCatalogItem } from '../../api/v1/baremetal-instance-catalog-item';
import { useCreateClusterCatalogItem } from '../../api/v1/cluster-catalog-item';
import { useCreateComputeInstanceCatalogItem } from '../../api/v1/compute-instance-catalog-item';
import { useTranslation } from '../../hooks/useTranslation';
import { catalogItemFieldDefinitions } from '../catalogProvision/catalogFieldDefinition';

// The demo tenant ID — in production this comes from the auth token / session
const DEMO_TENANT_ID = 'tenant-001';

type AnySourceItem = ComputeInstanceCatalogItem | ClusterCatalogItem | BareMetalInstanceCatalogItem;

interface TenantTemplateCustomizeModalProps {
  sourceItem: AnySourceItem;
  kind: CatalogItemKind;
  onClose: () => void;
  onSuccess: () => void;
}

function isMultilineField(path: string): boolean {
  return path.includes('ssh') || path.includes('pull_secret') || path.includes('user_data');
}

export function TenantTemplateCustomizeModal({
  sourceItem,
  kind,
  onClose,
  onSuccess,
}: TenantTemplateCustomizeModalProps) {
  const { t } = useTranslation();
  const definitions = catalogItemFieldDefinitions(sourceItem);

  const locked = definitions.filter((d) => !d.editable);
  const editable = definitions.filter((d) => d.editable);

  // State: override values keyed by path, pre-filled from existing defaults
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const def of editable) {
      if (def.default !== undefined && def.default !== null) {
        init[def.path] = String(def.default);
      }
    }
    return init;
  });

  const [title, setTitle] = useState(`${sourceItem.title} — Org default`);
  const [saving, setSaving] = useState(false);

  const createVm = useCreateComputeInstanceCatalogItem();
  const createCluster = useCreateClusterCatalogItem();
  const createBm = useCreateBareMetalInstanceCatalogItem();

  const mutationError =
    kind === 'vm' ? createVm.error : kind === 'cluster' ? createCluster.error : createBm.error;

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    createVm.reset();
    createCluster.reset();
    createBm.reset();

    try {
      // Build field_definitions with org-pinned defaults on editable fields
      const mergedFieldDefs = definitions.map((def) => ({
        path: def.path,
        display_name: def.displayName,
        editable: def.editable,
        ...(def.editable && overrides[def.path] !== undefined
          ? { default: overrides[def.path] }
          : def.default !== undefined
            ? { default: def.default }
            : {}),
        ...(def.validationSchema
          ? { validation_schema: JSON.stringify(def.validationSchema) }
          : {}),
      }));

      const body = {
        metadata: {
          name: title
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          labels: sourceItem.metadata?.labels ?? {},
        },
        title: title.trim(),
        description: sourceItem.description ?? '',
        template: (sourceItem as { template?: string }).template ?? '',
        published: true,
        tenant: DEMO_TENANT_ID,
        field_definitions: mergedFieldDefs,
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

      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={saving ? undefined : onClose}
      variant="medium"
      aria-labelledby="ttc-modal-title"
    >
      <ModalHeader title={t('Customize for my organization')} labelId="ttc-modal-title" />
      <ModalBody>
        <Content style={{ marginBottom: '1rem' }}>
          <p>
            {t(
              'Create an org-scoped copy of "{{title}}" with your organization\'s default values pre-filled for team members.',
              { title: sourceItem.title },
            )}
          </p>
        </Content>

        <Form>
          <FormGroup label={t('Template name')} fieldId="ttc-title" isRequired>
            <TextInput id="ttc-title" value={title} onChange={(_e, v) => setTitle(v)} isRequired />
          </FormGroup>
        </Form>

        {locked.length > 0 && (
          <>
            <Divider style={{ margin: '1.25rem 0 0.75rem' }} />
            <Title headingLevel="h3" size="md" style={{ marginBottom: '0.5rem' }}>
              {t('Provider-locked fields')}
            </Title>
            <Content
              component="small"
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                color: 'var(--pf-t--global--color--nonstatus--gray--default)',
              }}
            >
              {t('These values are set by the provider and cannot be changed.')}
            </Content>
            <DescriptionList isHorizontal isCompact>
              {locked.map((def) => (
                <DescriptionListGroup key={def.path}>
                  <DescriptionListTerm>{def.displayName || def.path}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {def.default !== undefined ? String(def.default) : <em>{t('(no default)')}</em>}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </>
        )}

        {editable.length > 0 && (
          <>
            <Divider style={{ margin: '1.25rem 0 0.75rem' }} />
            <Title headingLevel="h3" size="md" style={{ marginBottom: '0.5rem' }}>
              {t('Organization defaults')}
            </Title>
            <Content
              component="small"
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                color: 'var(--pf-t--global--color--nonstatus--gray--default)',
              }}
            >
              {t(
                'These values will be pre-filled for your team members. They can still override them when provisioning.',
              )}
            </Content>
            <Form>
              {editable.map((def) => (
                <FormGroup
                  key={def.path}
                  label={def.displayName || def.path}
                  fieldId={`ttc-field-${def.path}`}
                >
                  {isMultilineField(def.path) ? (
                    <TextArea
                      id={`ttc-field-${def.path}`}
                      value={overrides[def.path] ?? ''}
                      onChange={(_e, v) => setOverrides((prev) => ({ ...prev, [def.path]: v }))}
                      rows={4}
                      placeholder={t('Enter org default for {{name}}', {
                        name: def.displayName || def.path,
                      })}
                      resizeOrientation="vertical"
                    />
                  ) : (
                    <TextInput
                      id={`ttc-field-${def.path}`}
                      value={overrides[def.path] ?? ''}
                      onChange={(_e, v) => setOverrides((prev) => ({ ...prev, [def.path]: v }))}
                      placeholder={t('Enter org default for {{name}}', {
                        name: def.displayName || def.path,
                      })}
                    />
                  )}
                </FormGroup>
              ))}
            </Form>
          </>
        )}

        {Boolean(mutationError) && (
          <Alert
            variant="danger"
            isInline
            title={t('Failed to create org template')}
            style={{ marginTop: '1rem' }}
          >
            {mutationError instanceof Error ? mutationError.message : t('An error occurred')}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={saving || !title.trim()}
          >
            {t('Create org template')}
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={saving}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
}

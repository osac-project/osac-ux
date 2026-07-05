import React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { CatalogItemForDisplay, CatalogItemKind } from './catalogItemDisplay';
import { usePatchBareMetalInstanceCatalogItem } from '../../api/v1/baremetal-instance-catalog-item';
import { usePatchClusterCatalogItem } from '../../api/v1/cluster-catalog-item';
import { usePatchComputeInstanceCatalogItem } from '../../api/v1/compute-instance-catalog-item';
import { useTenants } from '../../api/v1/tenant';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface ManageCatalogItemTenantsModalProps {
  item: CatalogItemForDisplay;
  kind: CatalogItemKind;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageCatalogItemTenantsModal = ({
  item,
  kind,
  onClose,
  onSuccess,
}: ManageCatalogItemTenantsModalProps) => {
  const { t } = useTranslation();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants();

  const [selected, setSelected] = React.useState<string[]>(item.allowed_tenants ?? []);
  const [isSaving, setIsSaving] = React.useState(false);

  const patchVm = usePatchComputeInstanceCatalogItem();
  const patchCl = usePatchClusterCatalogItem();
  const patchBm = usePatchBareMetalInstanceCatalogItem();

  const patchError =
    kind === 'vm' ? patchVm.error : kind === 'cluster' ? patchCl.error : patchBm.error;

  const toggle = (tenantId: string) =>
    setSelected((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId],
    );

  const handleSave = async () => {
    setIsSaving(true);
    patchVm.reset();
    patchCl.reset();
    patchBm.reset();
    try {
      const patch = { allowed_tenants: selected } as never;
      if (kind === 'vm') {
        await patchVm.mutateAsync({ id: item.id, patch });
      } else if (kind === 'cluster') {
        await patchCl.mutateAsync({ id: item.id, patch });
      } else {
        await patchBm.mutateAsync({ id: item.id, patch });
      }
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={isSaving ? undefined : onClose}
      variant="small"
      aria-labelledby="manage-tenants-title"
    >
      <ModalHeader
        title={t('Manage access — {{name}}', { name: item.title })}
        labelId="manage-tenants-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <p
              style={{
                marginBottom: '0.5rem',
                fontSize: 'var(--pf-t--global--font--size--body--sm)',
              }}
            >
              {t(
                'Select which tenants can see this catalog item. Leave all unchecked to make it visible to every tenant.',
              )}
            </p>
          </StackItem>

          {selected.length === 0 ? null : (
            <StackItem>
              <Button variant="link" isInline onClick={() => setSelected([])}>
                {t('Grant access to all tenants')}
              </Button>
            </StackItem>
          )}

          <Divider />

          {tenantsLoading ? (
            <StackItem>
              <Spinner size="md" />
            </StackItem>
          ) : (
            <StackItem>
              <Stack hasGutter>
                {tenants.map((tenant) => (
                  <StackItem key={tenant.id}>
                    <Checkbox
                      id={`tenant-access-${tenant.id}`}
                      label={tenant.metadata?.name ?? tenant.id}
                      isChecked={selected.includes(tenant.id)}
                      onChange={() => toggle(tenant.id)}
                    />
                  </StackItem>
                ))}
              </Stack>
            </StackItem>
          )}

          {patchError && (
            <StackItem>
              <Alert variant="danger" isInline title={t('Failed to update access')}>
                {getErrorMessage(patchError)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          isDisabled={isSaving || tenantsLoading}
        >
          {t('Save')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isSaving}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

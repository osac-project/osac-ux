import React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormGroup,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import type { CatalogItemForDisplay, CatalogItemKind } from './catalogItemDisplay';
import {
  useCreateBareMetalInstanceCatalogItem,
  usePatchBareMetalInstanceCatalogItem,
} from '../../api/v1/baremetal-instance-catalog-item';
import { useBareMetalInstanceTemplates } from '../../api/v1/baremetal-instance-templates';
import {
  useCreateClusterCatalogItem,
  usePatchClusterCatalogItem,
} from '../../api/v1/cluster-catalog-item';
import { useClusterTemplates } from '../../api/v1/cluster-templates';
import {
  useCreateComputeInstanceCatalogItem,
  usePatchComputeInstanceCatalogItem,
} from '../../api/v1/compute-instance-catalog-item';
import { useComputeInstanceTemplates } from '../../api/v1/compute-instance-templates';
import { useCreateMaaSCatalogItem, usePatchMaaSCatalogItem } from '../../api/v1/maas-catalog-item';
import { useTenants } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';
import { catalogItemFieldDefinitions } from '../catalogProvision/catalogFieldDefinition';
import OsacForm from '../Form/OsacForm';

type ItemType = 'vm' | 'cluster' | 'baremetal' | 'maas';

interface FieldDefRow {
  path: string;
  displayName: string;
  editable: boolean;
}

const kindToItemType = (kind: CatalogItemKind): ItemType => {
  if (kind === 'cluster') {
    return 'cluster';
  }
  if (kind === 'baremetal') {
    return 'baremetal';
  }
  if (kind === 'maas') {
    return 'maas';
  }
  return 'vm';
};

interface EditItem {
  id: string;
  kind: CatalogItemKind;
  item: CatalogItemForDisplay;
}

interface CreateCatalogItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
  /** Optional template name/id to pre-fill the template selector */
  prefillTemplate?: string;
  /** When provided, modal opens in edit mode pre-filled from this item */
  editItem?: EditItem;
}

export const CreateCatalogItemModal = ({
  onClose,
  onSuccess,
  prefillTemplate,
  editItem,
}: CreateCatalogItemModalProps) => {
  const isEditMode = Boolean(editItem);
  const existingDefs = editItem ? catalogItemFieldDefinitions(editItem.item) : [];

  const [itemType, setItemType] = React.useState<ItemType>(
    editItem ? kindToItemType(editItem.kind) : 'vm',
  );
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [templateId, setTemplateId] = React.useState(
    editItem?.item.template ?? prefillTemplate ?? '',
  );
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [title, setTitle] = React.useState(editItem?.item.title ?? '');
  const [description, setDescription] = React.useState(editItem?.item.description ?? '');
  const [published, setPublished] = React.useState(
    editItem ? Boolean(editItem.item.published) : true,
  );
  const [pricePerHour, setPricePerHour] = React.useState(
    editItem?.item.metadata?.labels?.['price_per_hour'] ?? '',
  );
  const [osLabel, setOsLabel] = React.useState(editItem?.item.metadata?.labels?.['os'] ?? '');
  const [archLabel, setArchLabel] = React.useState(editItem?.item.metadata?.labels?.['arch'] ?? '');
  const [modelProvider, setModelProvider] = React.useState(
    editItem?.item.metadata?.labels?.['model_provider'] ?? '',
  );
  const [contextWindow, setContextWindow] = React.useState(
    editItem?.item.metadata?.labels?.['context_window'] ?? '',
  );
  const [pricePerInputToken, setPricePerInputToken] = React.useState(
    editItem?.item.metadata?.labels?.['price_per_input_token'] ?? '',
  );
  const [pricePerOutputToken, setPricePerOutputToken] = React.useState(
    editItem?.item.metadata?.labels?.['price_per_output_token'] ?? '',
  );
  const [workloadLabel, setWorkloadLabel] = React.useState(
    editItem?.item.metadata?.labels?.['workload'] ?? '',
  );
  const [fieldDefs, setFieldDefs] = React.useState<FieldDefRow[]>(
    existingDefs.length > 0
      ? existingDefs.map((d) => ({
          path: d.path,
          displayName: d.displayName,
          editable: d.editable,
        }))
      : [{ path: 'ssh_public_key', displayName: 'SSH Public Key', editable: true }],
  );
  const [allowedTenants, setAllowedTenants] = React.useState<string[]>(
    editItem ? ((editItem.item as { allowed_tenants?: string[] }).allowed_tenants ?? []) : [],
  );
  const [isPending, setIsPending] = React.useState(false);

  const { data: tenants = [] } = useTenants();

  const toggleTenant = (id: string) =>
    setAllowedTenants((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const { data: vmTemplates = [] } = useComputeInstanceTemplates();
  const { data: clusterTemplates = [] } = useClusterTemplates();
  const { data: bmTemplates = [] } = useBareMetalInstanceTemplates();

  const createVm = useCreateComputeInstanceCatalogItem();
  const createCluster = useCreateClusterCatalogItem();
  const createBm = useCreateBareMetalInstanceCatalogItem();
  const createMaas = useCreateMaaSCatalogItem();
  const patchVm = usePatchComputeInstanceCatalogItem();
  const patchCluster = usePatchClusterCatalogItem();
  const patchBm = usePatchBareMetalInstanceCatalogItem();
  const patchMaas = usePatchMaaSCatalogItem();

  const templates =
    itemType === 'vm'
      ? vmTemplates
      : itemType === 'cluster'
        ? clusterTemplates
        : itemType === 'maas'
          ? []
          : bmTemplates;

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const mutationError = isEditMode
    ? itemType === 'vm'
      ? patchVm.error
      : itemType === 'cluster'
        ? patchCluster.error
        : itemType === 'maas'
          ? patchMaas.error
          : patchBm.error
    : itemType === 'vm'
      ? createVm.error
      : itemType === 'cluster'
        ? createCluster.error
        : itemType === 'maas'
          ? createMaas.error
          : createBm.error;

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

  const onSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    setIsPending(true);
    createVm.reset();
    createCluster.reset();
    createBm.reset();
    patchVm.reset();
    patchCluster.reset();
    patchBm.reset();
    try {
      const labels = buildLabels();
      const fieldDefinitions = fieldDefs
        .filter((f) => f.path.trim())
        .map((f) => ({
          path: f.path.trim(),
          display_name: f.displayName.trim(),
          editable: f.editable,
        }));

      if (isEditMode && editItem) {
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
          await patchVm.mutateAsync({ id: editItem.id, patch: patch as never });
        } else if (itemType === 'cluster') {
          await patchCluster.mutateAsync({ id: editItem.id, patch: patch as never });
        } else if (itemType === 'maas') {
          await patchMaas.mutateAsync({ id: editItem.id, patch: patch as never });
        } else {
          await patchBm.mutateAsync({ id: editItem.id, patch: patch as never });
        }
      } else {
        const body = {
          metadata: { name: title.toLowerCase().replace(/\s+/g, '-'), labels },
          title: title.trim(),
          description: description.trim(),
          template: templateId || undefined,
          published,
          tenant: '',
          field_definitions: fieldDefinitions,
          allowed_tenants: allowedTenants,
        };
        if (itemType === 'vm') {
          await createVm.mutateAsync(body as unknown as Parameters<typeof createVm.mutateAsync>[0]);
        } else if (itemType === 'cluster') {
          await createCluster.mutateAsync(
            body as unknown as Parameters<typeof createCluster.mutateAsync>[0],
          );
        } else if (itemType === 'maas') {
          await createMaas.mutateAsync(body as never);
        } else {
          await createBm.mutateAsync(body as unknown as Parameters<typeof createBm.mutateAsync>[0]);
        }
      }
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="cci-create-title"
    >
      <ModalHeader
        title={
          isEditMode ? `Edit catalog item — ${editItem?.item.title ?? ''}` : 'Create catalog item'
        }
        labelId="cci-create-title"
      />
      <ModalBody>
        <OsacForm>
          <FormGroup label="Type" fieldId="cci-type" isRequired>
            <Select
              isOpen={typeOpen}
              onOpenChange={setTypeOpen}
              selected={itemType}
              onSelect={(_e, v) => {
                setItemType(v as ItemType);
                setTemplateId('');
                setTypeOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => !isEditMode && setTypeOpen(!typeOpen)}
                  isExpanded={typeOpen}
                  isDisabled={isEditMode}
                >
                  {
                    {
                      vm: 'Virtual Machine',
                      cluster: 'Cluster',
                      baremetal: 'Bare Metal',
                      maas: 'AI Model (MaaS)',
                    }[itemType]
                  }
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="vm">Virtual Machine</SelectOption>
                <SelectOption value="cluster">Cluster</SelectOption>
                <SelectOption value="baremetal">Bare Metal</SelectOption>
                <SelectOption value="maas">AI Model (MaaS)</SelectOption>
              </SelectList>
            </Select>
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
              placeholder="RHEL 9 — Small"
              isRequired
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
                    placeholder="Workload (e.g. ai)"
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
                    placeholder="Workload (e.g. ai)"
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
            <Alert
              variant="danger"
              title={isEditMode ? 'Failed to update catalog item' : 'Failed to create catalog item'}
              isInline
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={isPending || !title.trim()}
          isLoading={isPending}
        >
          {isEditMode ? 'Save' : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

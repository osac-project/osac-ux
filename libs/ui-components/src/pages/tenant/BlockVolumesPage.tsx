/**
 * flow: block-volumes
 * route: /storage/volumes (tenantUser, tenantAdmin)
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  SearchInput,
  Select,
  SelectOption,
  Stack,
  StackItem,
  TextArea,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  type BlockVolume,
  type BlockVolumeStorageClass,
  useAttachBlockVolume,
  useBlockVolumes,
  useDeleteBlockVolume,
  useDetachBlockVolume,
  usePatchBlockVolume,
} from '../../api/v1/block-volumes';
import { useComputeInstances } from '../../api/v1/compute-instance';
import { STORAGE_CLASS_COLORS, STORAGE_CLASS_LABELS } from '../../api/v1/compute-instance-disk';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_CLASSES: { value: BlockVolumeStorageClass; label: string }[] = [
  { value: 'ssd', label: 'SSD' },
  { value: 'nvme', label: 'NVMe' },
  { value: 'standard', label: 'Standard' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ATTACHED', label: 'Attached' },
  { value: 'PROVISIONING', label: 'Provisioning' },
  { value: 'FAILED', label: 'Failed' },
] as const;

type VolumeStatusFilter = (typeof STATUS_FILTERS)[number]['value'];

const VolumeStateLabel = ({ state }: { state: BlockVolume['status']['state'] }) => {
  const colorMap = {
    AVAILABLE: 'green',
    ATTACHED: 'blue',
    PROVISIONING: 'cyan',
    DETACHING: 'orange',
    DELETING: 'orange',
    FAILED: 'red',
  } as const;
  return (
    <Label color={colorMap[state] ?? 'grey'} isCompact>
      {state}
    </Label>
  );
};

// ---------------------------------------------------------------------------
// Edit volume modal
// ---------------------------------------------------------------------------

interface EditVolumeModalProps {
  volume: BlockVolume;
  onClose: () => void;
}

const EditVolumeModal = ({ volume, onClose }: EditVolumeModalProps) => {
  const { t } = useTranslation();
  const [sizeGib, setSizeGib] = useState(volume.spec.sizeGib);
  const [description, setDescription] = useState(volume.metadata?.description ?? '');
  const { mutateAsync, isPending, error } = usePatchBlockVolume();

  const handleSave = async () => {
    await mutateAsync({
      id: volume.id,
      patch: {
        sizeGib: sizeGib !== volume.spec.sizeGib ? sizeGib : undefined,
        description: description !== (volume.metadata?.description ?? '') ? description : undefined,
      },
    });
    onClose();
  };

  const hasChanges =
    sizeGib !== volume.spec.sizeGib || description !== (volume.metadata?.description ?? '');

  return (
    <Modal isOpen onClose={onClose} variant="medium" aria-label={t('Edit block volume')}>
      <ModalHeader
        title={t('Edit volume: {{name}}', { name: volume.metadata?.name ?? volume.id })}
      />
      <ModalBody>
        <Stack hasGutter>
          {error && (
            <StackItem>
              <Alert variant="danger" isInline title={t('Failed to update volume')}>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <FormGroup
              label={t('Size (GiB)')}
              fieldId="edit-vol-size"
              helperText={t('Size can only be increased.')}
            >
              <NumberInput
                id="edit-vol-size"
                value={sizeGib}
                min={volume.spec.sizeGib}
                onMinus={() => setSizeGib((v) => Math.max(volume.spec.sizeGib, v - 1))}
                onPlus={() => setSizeGib((v) => v + 1)}
                onChange={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  if (!isNaN(val) && val >= volume.spec.sizeGib) {
                    setSizeGib(val);
                  }
                }}
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label={t('Description')} fieldId="edit-vol-desc">
              <TextArea
                id="edit-vol-desc"
                value={description}
                onChange={(_e, v) => setDescription(v)}
                rows={3}
                placeholder={t('Optional description')}
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isPending}
          isDisabled={isPending || !hasChanges}
        >
          {t('Save changes')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Attach modal
// ---------------------------------------------------------------------------

interface AttachVolumeModalProps {
  volume: BlockVolume;
  onClose: () => void;
}

const AttachVolumeModal = ({ volume, onClose }: AttachVolumeModalProps) => {
  const { t } = useTranslation();
  const { data: vms = [] } = useComputeInstances();
  const [vmId, setVmId] = useState('');
  const [vmOpen, setVmOpen] = useState(false);
  const { mutateAsync, isPending, error } = useAttachBlockVolume();
  const selectedVm = vms.find((v) => v.id === vmId);

  const handleAttach = async () => {
    if (!vmId) {
      return;
    }
    await mutateAsync({ volumeId: volume.id, instanceId: vmId });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} variant="small" aria-label={t('Attach volume')}>
      <ModalHeader
        title={t('Attach "{{name}}" to a VM', { name: volume.metadata?.name ?? volume.id })}
      />
      <ModalBody>
        <Stack hasGutter>
          {error && (
            <StackItem>
              <Alert variant="danger" isInline title={t('Attach failed')}>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <Select
              isOpen={vmOpen}
              onSelect={(_e, val) => {
                setVmId(val as string);
                setVmOpen(false);
              }}
              onOpenChange={setVmOpen}
              selected={vmId || undefined}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setVmOpen(!vmOpen)}
                  isExpanded={vmOpen}
                  style={{ width: '100%' }}
                >
                  {selectedVm ? (selectedVm.metadata?.name ?? selectedVm.id) : t('Select VM')}
                </MenuToggle>
              )}
            >
              {vms.length === 0 ? (
                <SelectOption value="" isDisabled>
                  {t('No VMs available')}
                </SelectOption>
              ) : (
                vms.map((v) => (
                  <SelectOption key={v.id} value={v.id}>
                    {v.metadata?.name ?? v.id}
                  </SelectOption>
                ))
              )}
            </Select>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleAttach}
          isLoading={isPending}
          isDisabled={isPending || !vmId}
        >
          {t('Attach')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const BlockVolumesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: volumes = [], isLoading, error } = useBlockVolumes();
  const { mutateAsync: detachVolume } = useDetachBlockVolume();
  const { mutateAsync: deleteVolume } = useDeleteBlockVolume();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VolumeStatusFilter>('all');
  const [volumeToAttach, setVolumeToAttach] = useState<BlockVolume | null>(null);
  const [volumeToEdit, setVolumeToEdit] = useState<BlockVolume | null>(null);
  const [volumeToDelete, setVolumeToDelete] = useState<BlockVolume | null>(null);

  const filtered = useMemo(() => {
    return volumes.filter((vol) => {
      const name = vol.metadata?.name ?? vol.id;
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || vol.status.state === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [volumes, search, statusFilter]);

  return (
    <ListPage
      title={t('Block volumes')}
      description={t('Manage standalone block storage volumes for your virtual machines.')}
      actions={
        <Button variant="primary" onClick={() => navigate('/storage/volumes/new')}>
          {t('Create volume')}
        </Button>
      }
    >
      {volumeToAttach && (
        <AttachVolumeModal volume={volumeToAttach} onClose={() => setVolumeToAttach(null)} />
      )}
      {volumeToEdit && (
        <EditVolumeModal volume={volumeToEdit} onClose={() => setVolumeToEdit(null)} />
      )}
      {volumeToDelete && (
        <DeleteConfirmModal
          resourceName={volumeToDelete.metadata?.name ?? volumeToDelete.id}
          resourceKind={t('volume')}
          onConfirm={async () => {
            await deleteVolume(volumeToDelete.id);
            setVolumeToDelete(null);
          }}
          onClose={() => setVolumeToDelete(null)}
        />
      )}

      <ListPageBody isLoading={isLoading} error={error}>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          style={{ marginBottom: '1rem' }}
        >
          <FlexItem>
            <SearchInput
              placeholder={t('Search by name…')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup aria-label={t('Filter by volume status')}>
              {STATUS_FILTERS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  text={opt.label}
                  buttonId={`vol-filter-${opt.value}`}
                  isSelected={statusFilter === opt.value}
                  onChange={() => setStatusFilter(opt.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
        </Flex>

        {filtered.length === 0 ? (
          <Alert variant="info" isInline title={t('No volumes found')}>
            {search || statusFilter !== 'all'
              ? t('No volumes match your filters.')
              : t('No block volumes created yet. Click "Create volume" to get started.')}
          </Alert>
        ) : (
          <Table aria-label={t('Block volumes')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Size')}</Th>
                <Th>{t('Storage class')}</Th>
                <Th>{t('Status')}</Th>
                <Th>{t('Attached to')}</Th>
                <Th>{t('Created')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((vol) => {
                const isAttached = vol.status.state === 'ATTACHED';
                return (
                  <Tr key={vol.id}>
                    <Td dataLabel={t('Name')}>{vol.metadata?.name ?? vol.id}</Td>
                    <Td dataLabel={t('Size')}>{vol.spec.sizeGib} GiB</Td>
                    <Td dataLabel={t('Storage class')}>
                      <Label
                        color={STORAGE_CLASS_COLORS[vol.spec.storageClass] ?? 'grey'}
                        isCompact
                      >
                        {STORAGE_CLASS_LABELS[vol.spec.storageClass] ?? vol.spec.storageClass}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Status')}>
                      <VolumeStateLabel state={vol.status.state} />
                    </Td>
                    <Td dataLabel={t('Attached to')}>
                      {isAttached ? (
                        <Label color="blue" isCompact>
                          {vol.status.attachedToName ?? vol.status.attachedTo}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel={t('Created')}>
                      {vol.metadata?.creationTimestamp
                        ? new Date(vol.metadata.creationTimestamp).toLocaleDateString()
                        : '—'}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: (e) => {
                              e.stopPropagation();
                              setVolumeToEdit(vol);
                            },
                          },
                          {
                            title: t('Attach'),
                            isDisabled: isAttached || vol.status.state !== 'AVAILABLE',
                            onClick: (e) => {
                              e.stopPropagation();
                              setVolumeToAttach(vol);
                            },
                          },
                          {
                            title: t('Detach'),
                            isDisabled: !isAttached,
                            onClick: async (e) => {
                              e.stopPropagation();
                              await detachVolume(vol.id);
                            },
                          },
                          { isSeparator: true },
                          {
                            title: t('Delete'),
                            isDisabled: isAttached,
                            onClick: (e) => {
                              e.stopPropagation();
                              setVolumeToDelete(vol);
                            },
                            isDanger: true,
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

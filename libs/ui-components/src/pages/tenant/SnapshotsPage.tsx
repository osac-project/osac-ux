/**
 * flow: storage-snapshots
 * route: /storage/snapshots (tenantUser, tenantAdmin)
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchInput,
  Select,
  SelectOption,
  Stack,
  StackItem,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useComputeInstances } from '../../api/v1/compute-instance';
import {
  type VolumeSnapshot,
  useAllVolumeSnapshots,
  useDeleteVolumeSnapshot,
  useRestoreVolumeSnapshot,
} from '../../api/v1/volume-snapshot';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SnapshotStateLabel = ({ state }: { state: VolumeSnapshot['status']['state'] }) => {
  const colorMap = {
    READY: 'green',
    PENDING: 'blue',
    FAILED: 'red',
    DELETING: 'orange',
  } as const;
  return (
    <Label color={colorMap[state] ?? 'grey'} isCompact>
      {state}
    </Label>
  );
};

const diskLabel = (diskIndex: number) => (diskIndex === 0 ? 'Boot' : `Disk ${diskIndex}`);

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'READY', label: 'Ready' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
] as const;

type SnapStatusFilter = (typeof STATUS_FILTERS)[number]['value'];

// ---------------------------------------------------------------------------
// Restore modal
// ---------------------------------------------------------------------------

interface RestoreSnapshotModalProps {
  snapshot: VolumeSnapshot;
  onClose: () => void;
}

const RestoreSnapshotModal = ({ snapshot, onClose }: RestoreSnapshotModalProps) => {
  const { data: vms = [] } = useComputeInstances();
  const [vmId, setVmId] = useState('');
  const [vmOpen, setVmOpen] = useState(false);
  const { mutateAsync, isPending, error } = useRestoreVolumeSnapshot();

  const selectedVm = vms.find((v) => v.id === vmId);
  const snapName = snapshot.metadata?.name ?? snapshot.id;

  const handleRestore = async () => {
    if (!vmId) {
      return;
    }
    await mutateAsync({ snapshotId: snapshot.id, targetInstanceId: vmId });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} variant="small" aria-label="Restore snapshot">
      <ModalHeader title={`Restore snapshot "${snapName}"`} />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            Select a target VM to restore this snapshot to disk{' '}
            <strong>{diskLabel(snapshot.spec.diskIndex)}</strong>.
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" isInline title="Restore failed">
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
                  {selectedVm ? (selectedVm.metadata?.name ?? selectedVm.id) : 'Select target VM'}
                </MenuToggle>
              )}
            >
              {vms.length === 0 ? (
                <SelectOption value="" isDisabled>
                  No VMs available
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
          onClick={handleRestore}
          isLoading={isPending}
          isDisabled={isPending || !vmId}
        >
          Restore
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const SnapshotsPage = () => {
  const { data: snapshots = [], isLoading, error } = useAllVolumeSnapshots();
  const { data: vms = [] } = useComputeInstances();
  const { mutateAsync: deleteSnapshot } = useDeleteVolumeSnapshot('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SnapStatusFilter>('all');
  const [vmFilter, setVmFilter] = useState('all');
  const [snapshotToDelete, setSnapshotToDelete] = useState<VolumeSnapshot | null>(null);
  const [snapshotToRestore, setSnapshotToRestore] = useState<VolumeSnapshot | null>(null);
  const [vmFilterOpen, setVmFilterOpen] = useState(false);

  const vmName = (instanceId: string) =>
    vms.find((v) => v.id === instanceId)?.metadata?.name ?? instanceId;

  const filtered = useMemo(() => {
    return snapshots.filter((snap) => {
      const name = snap.metadata?.name ?? snap.id;
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || snap.status.state === statusFilter;
      const matchesVm = vmFilter === 'all' || snap.spec.sourceInstanceId === vmFilter;
      return matchesSearch && matchesStatus && matchesVm;
    });
  }, [snapshots, search, statusFilter, vmFilter]);

  const uniqueVms = useMemo(
    () => Array.from(new Set(snapshots.map((s) => s.spec.sourceInstanceId))),
    [snapshots],
  );

  const selectedVmLabel =
    vmFilter === 'all'
      ? 'All VMs'
      : (vms.find((v) => v.id === vmFilter)?.metadata?.name ?? vmFilter);

  return (
    <ListPage
      title="Snapshots"
      description="Manage volume snapshots across all your virtual machines."
    >
      {snapshotToDelete && (
        <DeleteConfirmModal
          resourceName={snapshotToDelete.metadata?.name ?? snapshotToDelete.id}
          resourceKind="snapshot"
          onConfirm={async () => {
            await deleteSnapshot(snapshotToDelete.id);
            setSnapshotToDelete(null);
          }}
          onClose={() => setSnapshotToDelete(null)}
        />
      )}
      {snapshotToRestore && (
        <RestoreSnapshotModal
          snapshot={snapshotToRestore}
          onClose={() => setSnapshotToRestore(null)}
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
              placeholder="Search by name…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup aria-label="Filter by snapshot status">
              {STATUS_FILTERS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  text={opt.label}
                  buttonId={`snap-filter-${opt.value}`}
                  isSelected={statusFilter === opt.value}
                  onChange={() => setStatusFilter(opt.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
          <FlexItem>
            <Select
              isOpen={vmFilterOpen}
              onSelect={(_e, val) => {
                setVmFilter(val as string);
                setVmFilterOpen(false);
              }}
              onOpenChange={setVmFilterOpen}
              selected={vmFilter}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setVmFilterOpen(!vmFilterOpen)}
                  isExpanded={vmFilterOpen}
                >
                  {selectedVmLabel}
                </MenuToggle>
              )}
            >
              <SelectOption value="all">All VMs</SelectOption>
              {uniqueVms.map((vmId) => (
                <SelectOption key={vmId} value={vmId}>
                  {vmName(vmId)}
                </SelectOption>
              ))}
            </Select>
          </FlexItem>
        </Flex>

        {filtered.length === 0 ? (
          <Alert variant="info" isInline title="No snapshots found">
            {search || statusFilter !== 'all' || vmFilter !== 'all'
              ? 'No snapshots match your filters.'
              : "No snapshots have been created yet. Go to a VM's Storage tab to create one."}
          </Alert>
        ) : (
          <Table aria-label="Volume snapshots" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Source VM</Th>
                <Th>Disk</Th>
                <Th>Size</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((snap) => (
                <Tr key={snap.id}>
                  <Td dataLabel="Name">{snap.metadata?.name ?? snap.id}</Td>
                  <Td dataLabel="Source VM">{vmName(snap.spec.sourceInstanceId)}</Td>
                  <Td dataLabel="Disk">{diskLabel(snap.spec.diskIndex)}</Td>
                  <Td dataLabel="Size">
                    {snap.status.sizeGib != null ? `${snap.status.sizeGib} GiB` : '—'}
                  </Td>
                  <Td dataLabel="Status">
                    <SnapshotStateLabel state={snap.status.state} />
                  </Td>
                  <Td dataLabel="Created">
                    {snap.metadata?.creationTimestamp
                      ? new Date(snap.metadata.creationTimestamp).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: 'Restore',
                          isDisabled: snap.status.state !== 'READY',
                          onClick: (e) => {
                            e.stopPropagation();
                            setSnapshotToRestore(snap);
                          },
                        },
                        { isSeparator: true },
                        {
                          title: 'Delete',
                          onClick: (e) => {
                            e.stopPropagation();
                            setSnapshotToDelete(snap);
                          },
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

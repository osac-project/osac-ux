/**
 * flow: provider-admin
 * route: /provider/host-types
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { HostType } from '@osac/types';

import {
  hostTypePricePerHour,
  isGpuHostType,
  useDeleteHostType,
  useHostTypes,
  usePatchHostType,
} from '../../api/v1/host-types';
import { EditPriceModal } from '../../components/catalog/EditPriceModal';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

export const ProviderHostTypesPage = () => {
  const navigate = useNavigate();
  const { data: hostTypes = [], isLoading, error } = useHostTypes();
  const deleteHT = useDeleteHostType();
  const patchHT = usePatchHostType();

  const [pendingDelete, setPendingDelete] = React.useState<HostType | null>(null);
  const [editPriceTarget, setEditPriceTarget] = React.useState<HostType | null>(null);

  const [search, setSearch] = useState('');
  const [gpuFilter, setGpuFilter] = useState<string[]>([]);
  const [gpuOpen, setGpuOpen] = useState(false);

  const toggleGpu = (v: string) =>
    setGpuFilter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setGpuFilter([]);
  };
  const hasFilters = search !== '' || gpuFilter.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hostTypes.filter((ht) => {
      if (q) {
        const name = (ht.metadata?.name ?? ht.id).toLowerCase();
        const title = (ht.title ?? '').toLowerCase();
        if (!name.includes(q) && !title.includes(q)) {
          return false;
        }
      }
      if (gpuFilter.length > 0) {
        const isGpu = isGpuHostType(ht);
        if (gpuFilter.includes('GPU') && !isGpu) {
          return false;
        }
        if (gpuFilter.includes('CPU only') && isGpu) {
          return false;
        }
      }
      return true;
    });
  }, [hostTypes, search, gpuFilter]);

  return (
    <>
      <ListPage
        title="Host Types"
        description="Host types define hardware profiles used by cluster node sets and bare metal instances. Attach a price_per_hour label to enable metering-based cost estimates."
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll}>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search host types"
                  placeholder="Search by name or title"
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>
              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={gpuFilter}
                  deleteLabel={(_g, v) =>
                    toggleGpu(typeof v === 'string' ? v : (v as { key: string }).key)
                  }
                  deleteLabelGroup={() => setGpuFilter([])}
                  categoryName="Type"
                >
                  <Select
                    isOpen={gpuOpen}
                    onOpenChange={setGpuOpen}
                    onSelect={(_e, v) => toggleGpu(v as string)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setGpuOpen(!gpuOpen)}
                        isExpanded={gpuOpen}
                        badge={gpuFilter.length || undefined}
                      >
                        Type
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {(['GPU', 'CPU only'] as const).map((v) => (
                        <SelectOption
                          key={v}
                          value={v}
                          hasCheckbox
                          isSelected={gpuFilter.includes(v)}
                        >
                          {v}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>
              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button variant="primary" onClick={() => navigate('/provider/host-types/new')}>
                  Create host type
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>No host types match the current filters.</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  Clear filters
                </Button>
              </FlexItem>
            </Flex>
          ) : hostTypes.length === 0 ? (
            <Alert variant="info" isInline title="No host types defined" />
          ) : (
            <Table aria-label="Host types" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Title</Th>
                  <Th>Tags</Th>
                  <Th>Price / hr</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((ht) => (
                  <Tr key={ht.id}>
                    <Td dataLabel="Name">
                      <strong>{ht.metadata?.name ?? ht.id}</strong>
                    </Td>
                    <Td dataLabel="Title">{ht.title || '—'}</Td>
                    <Td dataLabel="Tags">
                      <LabelGroup>
                        {isGpuHostType(ht) && (
                          <Label isCompact color="orange">
                            GPU
                          </Label>
                        )}
                        {ht.metadata?.labels?.['gpu_model'] && (
                          <Label isCompact color="yellow">
                            {ht.metadata.labels['gpu_model']}
                          </Label>
                        )}
                      </LabelGroup>
                    </Td>
                    <Td dataLabel="Price / hr">
                      {hostTypePricePerHour(ht) !== null
                        ? `$${hostTypePricePerHour(ht)?.toFixed(2)}/hr`
                        : '—'}
                    </Td>
                    <Td dataLabel="Actions" isActionCell>
                      <ActionsColumn
                        items={[
                          { title: 'Edit price', onClick: () => setEditPriceTarget(ht) },
                          { title: 'Delete', onClick: () => setPendingDelete(ht), isDanger: true },
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

      {editPriceTarget && (
        <EditPriceModal
          resourceName={
            editPriceTarget.title || editPriceTarget.metadata?.name || editPriceTarget.id
          }
          currentPrice={hostTypePricePerHour(editPriceTarget)?.toString() ?? ''}
          onClose={() => setEditPriceTarget(null)}
          error={patchHT.error}
          onSave={async (price) => {
            await patchHT.mutateAsync({
              id: editPriceTarget.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<HostType>,
            });
            setEditPriceTarget(null);
          }}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="host type"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteHT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteHT.error}
        />
      )}
    </>
  );
};

/**
 * flow: provider-admin
 * route: /provider/instance-types
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
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

import { type InstanceType, InstanceTypeState } from '@osac/types';

import {
  formatInstanceTypeSizing,
  instanceTypeName,
  instanceTypePricePerHour,
  useDeleteInstanceType,
  useInstanceTypes,
  usePatchInstanceType,
} from '../../api/v1/instance-types';
import { EditPriceModal } from '../../components/catalog/EditPriceModal';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

const STATE_LABELS: Record<number, { label: string; color: 'green' | 'orange' | 'red' | 'grey' }> =
  {
    [InstanceTypeState.ACTIVE]: { label: 'Active', color: 'green' },
    [InstanceTypeState.DEPRECATED]: { label: 'Deprecated', color: 'orange' },
    [InstanceTypeState.OBSOLETE]: { label: 'Obsolete', color: 'red' },
  };

export const ProviderInstanceTypesPage = () => {
  const navigate = useNavigate();
  const { data: instanceTypes = [], isLoading, error } = useInstanceTypes({}, { enabled: true });
  const deleteIT = useDeleteInstanceType();
  const patchIT = usePatchInstanceType();

  const [pendingDelete, setPendingDelete] = React.useState<InstanceType | null>(null);
  const [editPriceTarget, setEditPriceTarget] = React.useState<InstanceType | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilters, setStateFilters] = useState<number[]>([]);
  const [stateOpen, setStateOpen] = useState(false);

  const toggleState = (v: number) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setStateFilters([]);
  };
  const hasFilters = search !== '' || stateFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instanceTypes.filter((it) => {
      if (q) {
        const name = instanceTypeName(it).toLowerCase();
        const desc = (it.spec?.description ?? '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      if (
        stateFilters.length > 0 &&
        (it.spec?.state === undefined || !stateFilters.includes(it.spec.state))
      ) {
        return false;
      }
      return true;
    });
  }, [instanceTypes, search, stateFilters]);

  return (
    <>
      <ListPage
        title="Instance Types"
        description="Instance types define VM CPU/RAM bundles. Attach a price_per_hour label to enable metering-based cost estimates (OSAC-985, VMaaS instance-type-seconds billing dimension)."
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll}>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search instance types"
                  placeholder="Search by name or description"
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>
              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={stateFilters.map((s) => STATE_LABELS[s]?.label ?? String(s))}
                  deleteLabel={(_g, chip) => {
                    const label = typeof chip === 'string' ? chip : (chip as { key: string }).key;
                    const found = Object.entries(STATE_LABELS).find(([, v]) => v.label === label);
                    if (found) {
                      toggleState(Number(found[0]));
                    }
                  }}
                  deleteLabelGroup={() => setStateFilters([])}
                  categoryName="State"
                >
                  <Select
                    isOpen={stateOpen}
                    onOpenChange={setStateOpen}
                    onSelect={(_e, v) => toggleState(v as number)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setStateOpen(!stateOpen)}
                        isExpanded={stateOpen}
                        badge={stateFilters.length || undefined}
                      >
                        State
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {Object.entries(STATE_LABELS).map(([k, v]) => (
                        <SelectOption
                          key={k}
                          value={Number(k)}
                          hasCheckbox
                          isSelected={stateFilters.includes(Number(k))}
                        >
                          {v.label}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>
              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button variant="primary" onClick={() => navigate('/provider/instance-types/new')}>
                  Create instance type
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>No instance types match the current filters.</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  Clear filters
                </Button>
              </FlexItem>
            </Flex>
          ) : instanceTypes.length === 0 ? (
            <Alert variant="info" isInline title="No instance types defined" />
          ) : (
            <Table aria-label="Instance types" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Sizing</Th>
                  <Th>Price / hr</Th>
                  <Th>State</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((it) => {
                  const stateInfo =
                    it.spec?.state !== undefined ? STATE_LABELS[it.spec.state] : undefined;
                  return (
                    <Tr key={it.id}>
                      <Td dataLabel="Name">
                        <strong>{instanceTypeName(it)}</strong>
                      </Td>
                      <Td dataLabel="Sizing">{formatInstanceTypeSizing(it)}</Td>
                      <Td dataLabel="Price / hr">
                        {instanceTypePricePerHour(it) !== null
                          ? `$${instanceTypePricePerHour(it)?.toFixed(2)}/hr`
                          : '—'}
                      </Td>
                      <Td dataLabel="State">
                        {stateInfo ? (
                          <Label isCompact color={stateInfo.color}>
                            {stateInfo.label}
                          </Label>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td dataLabel="Actions" isActionCell>
                        <ActionsColumn
                          items={[
                            { title: 'Edit price', onClick: () => setEditPriceTarget(it) },
                            {
                              title: 'Delete',
                              onClick: () => setPendingDelete(it),
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

      {editPriceTarget && (
        <EditPriceModal
          resourceName={instanceTypeName(editPriceTarget)}
          currentPrice={instanceTypePricePerHour(editPriceTarget)?.toString() ?? ''}
          onClose={() => setEditPriceTarget(null)}
          error={patchIT.error}
          onSave={async (price) => {
            await patchIT.mutateAsync({
              id: editPriceTarget.id,
              patch: {
                metadata: { labels: { price_per_hour: price } },
              } as unknown as Partial<InstanceType>,
            });
            setEditPriceTarget(null);
          }}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={instanceTypeName(pendingDelete)}
          resourceKind="instance type"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteIT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteIT.error}
        />
      )}
    </>
  );
};

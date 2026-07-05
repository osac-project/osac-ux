/**
 * flow: storage-backends
 * route: /provider/storage-backends
 */
import { useMemo, useState } from 'react';
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

import type { StorageBackend } from '../../api/v1/storage-backend';
import { useDeleteStorageBackend, useStorageBackends } from '../../api/v1/storage-backend';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

const PROVIDERS = ['ceph', 'nfs', 's3'] as const;
type Provider = (typeof PROVIDERS)[number];
const STATES = ['READY', 'PENDING', 'FAILED'] as const;
type BackendState = (typeof STATES)[number];

const PROVIDER_COLORS: Record<Provider, 'blue' | 'orange' | 'purple'> = {
  ceph: 'orange',
  nfs: 'blue',
  s3: 'purple',
};

const STATE_COLORS: Record<BackendState, 'green' | 'orange' | 'red'> = {
  READY: 'green',
  PENDING: 'orange',
  FAILED: 'red',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ProviderFilter = Provider;
type StateFilter = BackendState;

export const ProviderStorageBackendsPage = () => {
  const navigate = useNavigate();
  const { data: backends = [], isLoading, error } = useStorageBackends();
  const deleteBackend = useDeleteStorageBackend();

  const [pendingDelete, setPendingDelete] = useState<StorageBackend | null>(null);

  const [search, setSearch] = useState('');
  const [providerFilters, setProviderFilters] = useState<ProviderFilter[]>([]);
  const [stateFilters, setStateFilters] = useState<StateFilter[]>([]);
  const [providerOpen, setProviderOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const toggleProvider = (v: ProviderFilter) =>
    setProviderFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleState = (v: StateFilter) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setProviderFilters([]);
    setStateFilters([]);
  };
  const hasFilters = search !== '' || providerFilters.length > 0 || stateFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return backends.filter((b) => {
      if (q) {
        const name = (b.metadata?.name ?? b.id).toLowerCase();
        const desc = (b.spec.description ?? b.metadata?.description ?? '').toLowerCase();
        const ep = b.spec.endpoint.toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !ep.includes(q)) {
          return false;
        }
      }
      if (providerFilters.length > 0 && !providerFilters.includes(b.spec.provider)) {
        return false;
      }
      if (stateFilters.length > 0 && !stateFilters.includes(b.status.state)) {
        return false;
      }
      return true;
    });
  }, [backends, search, providerFilters, stateFilters]);

  return (
    <>
      <ListPage
        title="Storage Backends"
        description="Physical storage systems connected to this provider. Storage tiers are backed by these systems."
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
            <ToolbarContent>
              <ToolbarItem variant="search-filter">
                <SearchInput
                  aria-label="Search storage backends"
                  placeholder="Search by name, description, or endpoint"
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>

              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={providerFilters}
                  deleteLabel={(_g, v) => toggleProvider(v as ProviderFilter)}
                  deleteLabelGroup={() => setProviderFilters([])}
                  categoryName="Provider"
                >
                  <Select
                    isOpen={providerOpen}
                    onOpenChange={setProviderOpen}
                    onSelect={(_e, v) => toggleProvider(v as ProviderFilter)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setProviderOpen(!providerOpen)}
                        isExpanded={providerOpen}
                        badge={providerFilters.length || undefined}
                      >
                        Provider
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {PROVIDERS.map((p) => (
                        <SelectOption
                          key={p}
                          value={p}
                          hasCheckbox
                          isSelected={providerFilters.includes(p)}
                        >
                          {p.toUpperCase()}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>

                <ToolbarFilter
                  labels={stateFilters}
                  deleteLabel={(_g, v) => toggleState(v as StateFilter)}
                  deleteLabelGroup={() => setStateFilters([])}
                  categoryName="State"
                >
                  <Select
                    isOpen={stateOpen}
                    onOpenChange={setStateOpen}
                    onSelect={(_e, v) => toggleState(v as StateFilter)}
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
                      {STATES.map((s) => (
                        <SelectOption
                          key={s}
                          value={s}
                          hasCheckbox
                          isSelected={stateFilters.includes(s)}
                        >
                          {s}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>

              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button
                  variant="primary"
                  onClick={() => navigate('/provider/storage-backends/new')}
                >
                  Register backend
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>No backends match the current filters.</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  Clear filters
                </Button>
              </FlexItem>
            </Flex>
          ) : backends.length === 0 ? (
            <Alert variant="info" isInline title="No storage backends configured" />
          ) : (
            <Table aria-label="Storage backends" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Endpoint</Th>
                  <Th>Description</Th>
                  <Th>State</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((b) => (
                  <Tr key={b.id}>
                    <Td dataLabel="Name">
                      <strong>{b.metadata?.name ?? b.id}</strong>
                    </Td>
                    <Td dataLabel="Provider">
                      <Label color={PROVIDER_COLORS[b.spec.provider] ?? 'grey'} isCompact>
                        {b.spec.provider.toUpperCase()}
                      </Label>
                    </Td>
                    <Td dataLabel="Endpoint">
                      <code style={{ fontSize: '0.8em' }}>{b.spec.endpoint}</code>
                    </Td>
                    <Td dataLabel="Description">
                      {b.spec.description || b.metadata?.description || '—'}
                    </Td>
                    <Td dataLabel="State">
                      <Label color={STATE_COLORS[b.status.state] ?? 'grey'} isCompact>
                        {b.status.state}
                      </Label>
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'Edit',
                            onClick: () => navigate(`/provider/storage-backends/${b.id}/edit`),
                          },
                          { title: 'Delete', onClick: () => setPendingDelete(b), isDanger: true },
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

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.metadata?.name ?? pendingDelete.id}
          resourceKind="storage backend"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteBackend.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteBackend.error}
        />
      )}
    </>
  );
};

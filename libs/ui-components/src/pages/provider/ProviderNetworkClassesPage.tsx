/**
 * flow: provider-admin
 * step: manage-network-classes
 * route: /provider/network-classes
 */
import { useMemo, useState } from 'react';
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

import type { NetworkClass } from '@osac/types';
import { useDeleteNetworkClass, useNetworkClasses } from '@osac/ui-components/api/v1/networking';
import { NetworkStatusLabel } from '@osac/ui-components/components/Network/NetworkStatusLabel';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { DeleteConfirmModal } from '@osac/ui-components/components/shared/DeleteConfirmModal';

type CapabilityFilter = 'IPv4' | 'IPv6' | 'Dual-stack';
type StatusFilter = string;

export const ProviderNetworkClassesPage = () => {
  const navigate = useNavigate();
  const { data: classes = [], isLoading, error } = useNetworkClasses();
  const deleteNC = useDeleteNetworkClass();

  const [pendingDelete, setPendingDelete] = useState<NetworkClass | null>(null);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [capFilters, setCapFilters] = useState<CapabilityFilter[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [defaultOnly, setDefaultOnly] = useState(false);

  const [capOpen, setCapOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Unique statuses from data
  const availableStatuses = useMemo(
    () => [...new Set(classes.map((c) => c.status?.state).filter(Boolean) as string[])],
    [classes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((nc) => {
      if (q) {
        const name = (nc.metadata?.name ?? nc.id).toLowerCase();
        const title = (nc.title ?? '').toLowerCase();
        if (!name.includes(q) && !title.includes(q)) {
          return false;
        }
      }
      if (capFilters.length > 0) {
        const caps = nc.capabilities;
        const hasIPv4 = caps?.supportsIpv4;
        const hasIPv6 = caps?.supportsIpv6;
        const hasDual = caps?.supportsDualStack;
        const match = capFilters.every((f) =>
          f === 'IPv4' ? hasIPv4 : f === 'IPv6' ? hasIPv6 : hasDual,
        );
        if (!match) {
          return false;
        }
      }
      if (statusFilters.length > 0 && !statusFilters.includes(nc.status?.state ?? '')) {
        return false;
      }
      if (defaultOnly && !nc.isDefault) {
        return false;
      }
      return true;
    });
  }, [classes, search, capFilters, statusFilters, defaultOnly]);

  const toggleCap = (v: CapabilityFilter) =>
    setCapFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleStatus = (v: StatusFilter) =>
    setStatusFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setCapFilters([]);
    setStatusFilters([]);
    setDefaultOnly(false);
  };

  const hasFilters = search || capFilters.length > 0 || statusFilters.length > 0 || defaultOnly;

  return (
    <>
      <ListPage
        title="Network classes"
        description="Network classes define the underlying network implementation strategies available to tenants. Each class determines available capabilities such as IPv4, IPv6, or dual-stack addressing."
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
            <ToolbarContent>
              <ToolbarItem variant="search-filter">
                <SearchInput
                  aria-label="Search network classes"
                  placeholder="Search by name or title"
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                />
              </ToolbarItem>

              <ToolbarGroup variant="filter-group">
                <ToolbarFilter
                  labels={capFilters}
                  deleteLabel={(_g, v) => toggleCap(v as CapabilityFilter)}
                  deleteLabelGroup={() => setCapFilters([])}
                  categoryName="Capability"
                >
                  <Select
                    isOpen={capOpen}
                    onOpenChange={setCapOpen}
                    onSelect={(_e, v) => {
                      toggleCap(v as CapabilityFilter);
                      setCapOpen(false);
                    }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setCapOpen(!capOpen)}
                        isExpanded={capOpen}
                        badge={capFilters.length || undefined}
                      >
                        Capability
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {(['IPv4', 'IPv6', 'Dual-stack'] as CapabilityFilter[]).map((c) => (
                        <SelectOption
                          key={c}
                          value={c}
                          hasCheckbox
                          isSelected={capFilters.includes(c)}
                        >
                          {c}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>

                <ToolbarFilter
                  labels={statusFilters}
                  deleteLabel={(_g, v) => toggleStatus(v as string)}
                  deleteLabelGroup={() => setStatusFilters([])}
                  categoryName="Status"
                >
                  <Select
                    isOpen={statusOpen}
                    onOpenChange={setStatusOpen}
                    onSelect={(_e, v) => {
                      toggleStatus(v as string);
                      setStatusOpen(false);
                    }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setStatusOpen(!statusOpen)}
                        isExpanded={statusOpen}
                        badge={statusFilters.length || undefined}
                      >
                        Status
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {availableStatuses.map((s) => (
                        <SelectOption
                          key={s}
                          value={s}
                          hasCheckbox
                          isSelected={statusFilters.includes(s)}
                        >
                          {s}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>

                <ToolbarItem>
                  <Button
                    variant={defaultOnly ? 'primary' : 'plain'}
                    size="sm"
                    onClick={() => setDefaultOnly((v) => !v)}
                  >
                    Default only
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>

              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button variant="primary" onClick={() => navigate('/provider/network-classes/new')}>
                  Create network class
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>No network classes match the current filters.</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  Clear filters
                </Button>
              </FlexItem>
            </Flex>
          ) : classes.length === 0 ? (
            <Alert variant="info" isInline title="No network classes">
              No network classes have been defined yet. Create one to allow tenants to provision
              virtual networks.
            </Alert>
          ) : (
            <Table aria-label="Network classes" variant="compact">
              <Thead>
                <Tr>
                  <Th>Identifier</Th>
                  <Th>Title</Th>
                  <Th>Capabilities</Th>
                  <Th>Status</Th>
                  <Th>Default</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((nc: NetworkClass) => (
                  <Tr key={nc.id}>
                    <Td dataLabel="Identifier">
                      <strong>{nc.metadata?.name ?? nc.id}</strong>
                    </Td>
                    <Td dataLabel="Title">{nc.title || '—'}</Td>
                    <Td dataLabel="Capabilities">
                      {nc.capabilities ? (
                        <LabelGroup>
                          {nc.capabilities.supportsIpv4 && (
                            <Label isCompact color="blue">
                              IPv4
                            </Label>
                          )}
                          {nc.capabilities.supportsIpv6 && (
                            <Label isCompact color="purple">
                              IPv6
                            </Label>
                          )}
                          {nc.capabilities.supportsDualStack && (
                            <Label isCompact color="teal">
                              Dual-stack
                            </Label>
                          )}
                        </LabelGroup>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Status">
                      <NetworkStatusLabel state={nc.status?.state} />
                    </Td>
                    <Td dataLabel="Default">
                      {nc.isDefault ? (
                        <Label isCompact color="yellow">
                          Default
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Actions" isActionCell>
                      <ActionsColumn
                        items={[
                          { title: 'Delete', onClick: () => setPendingDelete(nc), isDanger: true },
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
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="network class"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteNC.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteNC.error}
        />
      )}
    </>
  );
};

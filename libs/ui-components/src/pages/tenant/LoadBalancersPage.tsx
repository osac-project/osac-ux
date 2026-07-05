/**
 * flow: load-balancers
 * route: /load-balancers
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

import {
  type LoadBalancer,
  useDeleteLoadBalancer,
  useLoadBalancers,
} from '../../api/v1/load-balancer';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const STATE_COLORS: Record<string, 'green' | 'orange' | 'red' | 'grey' | 'blue'> = {
  READY: 'green',
  PENDING: 'orange',
  UPDATING: 'blue',
  DELETING: 'orange',
  FAILED: 'red',
};

const ALL_STATES = ['PENDING', 'READY', 'UPDATING', 'DELETING', 'FAILED'] as const;
type StateFilter = (typeof ALL_STATES)[number];
type ProtocolFilter = 'TCP' | 'HTTP' | 'HTTPS' | 'UDP';
const ALL_PROTOCOLS: ProtocolFilter[] = ['TCP', 'HTTP', 'HTTPS', 'UDP'];

const StateBadge = ({ state }: { state?: string }) => (
  <Label color={STATE_COLORS[state ?? ''] ?? 'grey'} isCompact>
    {state ?? '—'}
  </Label>
);

const listenersLabel = (lb: LoadBalancer) =>
  lb.spec.listeners.map((l) => `${l.protocol}:${l.port}`).join(', ') || '—';

export const LoadBalancersPage = () => {
  const navigate = useNavigate();
  const { data: lbs = [], isLoading, error } = useLoadBalancers();
  const { mutate: deleteLb } = useDeleteLoadBalancer();
  const [toDelete, setToDelete] = useState<LoadBalancer | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilters, setStateFilters] = useState<StateFilter[]>([]);
  const [protoFilters, setProtoFilters] = useState<ProtocolFilter[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [protoOpen, setProtoOpen] = useState(false);

  const toggleState = (v: StateFilter) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleProto = (v: ProtocolFilter) =>
    setProtoFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setStateFilters([]);
    setProtoFilters([]);
  };
  const hasFilters = search !== '' || stateFilters.length > 0 || protoFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lbs.filter((lb) => {
      if (q) {
        const name = (lb.metadata?.name ?? lb.id).toLowerCase();
        const desc = (lb.spec.description ?? '').toLowerCase();
        const net = lb.spec.virtualNetwork.toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !net.includes(q)) {
          return false;
        }
      }
      if (stateFilters.length > 0 && !stateFilters.includes(lb.status.state)) {
        return false;
      }
      if (protoFilters.length > 0) {
        const lbProtocols = lb.spec.listeners.map((l) => l.protocol);
        if (!protoFilters.some((p) => lbProtocols.includes(p))) {
          return false;
        }
      }
      return true;
    });
  }, [lbs, search, stateFilters, protoFilters]);

  return (
    <ListPage
      title="Load Balancers"
      description="Distribute network traffic across compute resources."
    >
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={`Delete load balancer "${toDelete.metadata?.name ?? toDelete.id}"?`}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  deleteLb(toDelete.id);
                  setToDelete(null);
                }}
              >
                Delete
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                Cancel
              </Button>
            </>
          }
        />
      )}

      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
          <ToolbarContent>
            <ToolbarItem variant="search-filter">
              <SearchInput
                aria-label="Search load balancers"
                placeholder="Search by name, description, or network"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>

            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={stateFilters}
                deleteChip={(_g, v) => toggleState(v as StateFilter)}
                deleteChipGroup={() => setStateFilters([])}
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
                    {ALL_STATES.map((s) => (
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

              <ToolbarFilter
                chips={protoFilters}
                deleteChip={(_g, v) => toggleProto(v as ProtocolFilter)}
                deleteChipGroup={() => setProtoFilters([])}
                categoryName="Protocol"
              >
                <Select
                  isOpen={protoOpen}
                  onOpenChange={setProtoOpen}
                  onSelect={(_e, v) => toggleProto(v as ProtocolFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setProtoOpen(!protoOpen)}
                      isExpanded={protoOpen}
                      badge={protoFilters.length || undefined}
                    >
                      Protocol
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {ALL_PROTOCOLS.map((p) => (
                      <SelectOption
                        key={p}
                        value={p}
                        hasCheckbox
                        isSelected={protoFilters.includes(p)}
                      >
                        {p}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>

            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/load-balancers/new')}>
                Create load balancer
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>No load balancers match the current filters.</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                Clear filters
              </Button>
            </FlexItem>
          </Flex>
        ) : lbs.length === 0 ? (
          <Alert variant="info" isInline title="No load balancers found">
            Create a load balancer to distribute traffic across your instances.
          </Alert>
        ) : (
          <Table aria-label="Load balancers" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Virtual Network</Th>
                <Th>Listeners</Th>
                <Th>Internal IP</Th>
                <Th>External IP</Th>
                <Th>State</Th>
                <Th>Created</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((lb) => (
                <Tr key={lb.id}>
                  <Td dataLabel="Name">
                    <strong>{lb.metadata?.name ?? lb.id}</strong>
                  </Td>
                  <Td dataLabel="Virtual Network">{lb.spec.virtualNetwork}</Td>
                  <Td dataLabel="Listeners">{listenersLabel(lb)}</Td>
                  <Td dataLabel="Internal IP">
                    {lb.status.internalIpAddress ? (
                      <code style={{ fontSize: '0.85em' }}>{lb.status.internalIpAddress}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel="External IP">
                    {lb.status.externalIpAddress ? (
                      <code style={{ fontSize: '0.85em' }}>{lb.status.externalIpAddress}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel="State">
                    <StateBadge state={lb.status.state} />
                  </Td>
                  <Td dataLabel="Created">
                    {lb.metadata?.creationTimestamp
                      ? new Date(lb.metadata.creationTimestamp).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: 'Edit',
                          onClick: () => navigate(`/load-balancers/${lb.id}/edit`),
                        },
                        {
                          title: 'Delete',
                          onClick: () => setToDelete(lb),
                          isDanger: true,
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

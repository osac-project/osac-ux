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
import { useTranslation } from '../../hooks/useTranslation';

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
  const { t } = useTranslation();
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
      title={t('Load Balancers')}
      description={t('Distribute network traffic across compute resources.')}
    >
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={t('Delete load balancer "{{name}}"?', {
            name: toDelete.metadata?.name ?? toDelete.id,
          })}
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
                {t('Delete')}
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                {t('Cancel')}
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
                aria-label={t('Search load balancers')}
                placeholder={t('Search by name, description, or network')}
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
                categoryName={t('State')}
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
                      {t('State')}
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
                categoryName={t('Protocol')}
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
                      {t('Protocol')}
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
                {t('Create load balancer')}
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>{t('No load balancers match the current filters.')}</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                {t('Clear filters')}
              </Button>
            </FlexItem>
          </Flex>
        ) : lbs.length === 0 ? (
          <Alert variant="info" isInline title={t('No load balancers found')}>
            {t('Create a load balancer to distribute traffic across your instances.')}
          </Alert>
        ) : (
          <Table aria-label={t('Load balancers')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Virtual Network')}</Th>
                <Th>{t('Listeners')}</Th>
                <Th>{t('Internal IP')}</Th>
                <Th>{t('External IP')}</Th>
                <Th>{t('State')}</Th>
                <Th>{t('Created')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((lb) => (
                <Tr key={lb.id}>
                  <Td dataLabel={t('Name')}>
                    <strong>{lb.metadata?.name ?? lb.id}</strong>
                  </Td>
                  <Td dataLabel={t('Virtual Network')}>{lb.spec.virtualNetwork}</Td>
                  <Td dataLabel={t('Listeners')}>{listenersLabel(lb)}</Td>
                  <Td dataLabel={t('Internal IP')}>
                    {lb.status.internalIpAddress ? (
                      <code style={{ fontSize: '0.85em' }}>{lb.status.internalIpAddress}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel={t('External IP')}>
                    {lb.status.externalIpAddress ? (
                      <code style={{ fontSize: '0.85em' }}>{lb.status.externalIpAddress}</code>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td dataLabel={t('State')}>
                    <StateBadge state={lb.status.state} />
                  </Td>
                  <Td dataLabel={t('Created')}>
                    {lb.metadata?.creationTimestamp
                      ? new Date(lb.metadata.creationTimestamp).toLocaleDateString()
                      : '—'}
                  </Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: t('Edit'),
                          onClick: () => navigate(`/load-balancers/${lb.id}/edit`),
                        },
                        {
                          title: t('Delete'),
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

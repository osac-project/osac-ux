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
  Tooltip,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { NetworkClass } from '@osac/types';
import { networkIsolationEnforced } from '@osac/ui-components/api/v1/compliance';
import {
  useDeleteNetworkClass,
  useNetworkClasses,
  usePatchNetworkClass,
} from '@osac/ui-components/api/v1/networking';
import { EditPriceModal } from '@osac/ui-components/components/catalog/EditPriceModal';
import { NetworkStatusLabel } from '@osac/ui-components/components/Network/NetworkStatusLabel';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { DeleteConfirmModal } from '@osac/ui-components/components/shared/DeleteConfirmModal';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CapabilityFilter = 'IPv4' | 'IPv6' | 'Dual-stack';
type StatusFilter = string;

export const ProviderNetworkClassesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: classes = [], isLoading, error } = useNetworkClasses();
  const deleteNC = useDeleteNetworkClass();
  const patchNC = usePatchNetworkClass();

  const [pendingDelete, setPendingDelete] = useState<NetworkClass | null>(null);
  const [priceTarget, setPriceTarget] = useState<NetworkClass | null>(null);

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
        title={t('Network classes')}
        description={t(
          'Network classes define the underlying network implementation strategies available to tenants. Each class determines available capabilities such as IPv4, IPv6, or dual-stack addressing.',
        )}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
            <ToolbarContent>
              <ToolbarItem variant="search-filter">
                <SearchInput
                  aria-label={t('Search network classes')}
                  placeholder={t('Search by name or title')}
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
                  categoryName={t('Capability')}
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
                        {t('Capability')}
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
                  categoryName={t('Status')}
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
                        {t('Status')}
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
                    {t('Default only')}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>

              <ToolbarItem align={{ default: 'alignEnd' }}>
                <Button variant="primary" onClick={() => navigate('/provider/network-classes/new')}>
                  {t('Create network class')}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {hasFilters && filtered.length === 0 ? (
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ gap: '0.5rem', padding: '1rem 0' }}
            >
              <FlexItem>{t('No network classes match the current filters.')}</FlexItem>
              <FlexItem>
                <Button variant="link" isInline onClick={clearAll}>
                  {t('Clear filters')}
                </Button>
              </FlexItem>
            </Flex>
          ) : classes.length === 0 ? (
            <Alert variant="info" isInline title={t('No network classes')}>
              {t(
                'No network classes have been defined yet. Create one to allow tenants to provision virtual networks.',
              )}
            </Alert>
          ) : (
            <Table aria-label={t('Network classes')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Identifier')}</Th>
                  <Th>{t('Title')}</Th>
                  <Th>{t('Capabilities')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Default')}</Th>
                  <Th>{t('Isolation')}</Th>
                  <Th>{t('Price / attached-hour')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((nc: NetworkClass) => (
                  <Tr key={nc.id}>
                    <Td dataLabel={t('Identifier')}>
                      <strong>{nc.metadata?.name ?? nc.id}</strong>
                    </Td>
                    <Td dataLabel={t('Title')}>{nc.title || '—'}</Td>
                    <Td dataLabel={t('Capabilities')}>
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
                              {t('Dual-stack')}
                            </Label>
                          )}
                        </LabelGroup>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel={t('Status')}>
                      <NetworkStatusLabel state={nc.status?.state} />
                    </Td>
                    <Td dataLabel={t('Default')}>
                      {nc.isDefault ? (
                        <Label isCompact color="yellow">
                          {t('Default')}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel={t('Isolation')}>
                      <Tooltip
                        content={t(
                          'Network isolation enforcement via per-tenant VRFs (Netris, OSAC-3028). Isolated classes prevent cross-tenant L2/L3 reachability.',
                        )}
                      >
                        <Label
                          isCompact
                          color={networkIsolationEnforced(nc) ? 'green' : 'grey'}
                          variant={networkIsolationEnforced(nc) ? 'filled' : 'outline'}
                        >
                          {networkIsolationEnforced(nc) ? t('Isolated (VRF)') : t('Shared')}
                        </Label>
                      </Tooltip>
                    </Td>
                    <Td dataLabel={t('Price / attached-hour')}>
                      {nc.metadata?.labels?.['price_per_hour']
                        ? `$${nc.metadata.labels['price_per_hour']}`
                        : '—'}
                    </Td>
                    <Td dataLabel={t('Actions')} isActionCell>
                      <ActionsColumn
                        items={[
                          { title: t('Set price'), onClick: () => setPriceTarget(nc) },
                          {
                            title: t('Delete'),
                            onClick: () => setPendingDelete(nc),
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

      {priceTarget && (
        <EditPriceModal
          resourceName={priceTarget.title || priceTarget.metadata?.name || priceTarget.id}
          currentPrice={priceTarget.metadata?.labels?.['price_per_hour'] ?? ''}
          label={t('Price per attached-hour (USD)')}
          onClose={() => setPriceTarget(null)}
          error={patchNC.error}
          onSave={async (price) => {
            await patchNC.mutateAsync({
              id: priceTarget.id,
              patch: {
                metadata: {
                  ...priceTarget.metadata,
                  labels: { ...(priceTarget.metadata?.labels ?? {}), price_per_hour: price },
                },
              },
            });
            setPriceTarget(null);
          }}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind={t('network class')}
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

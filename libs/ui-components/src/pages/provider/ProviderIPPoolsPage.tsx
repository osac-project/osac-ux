/**
 * flow: ip-pools
 * route: /provider/ip-pools
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
  type ExternalIPPool,
  useDeleteExternalIPPool,
  useExternalIPPools,
  usePatchExternalIPPool,
} from '../../api/v1/ip-management';
import { useTenants } from '../../api/v1/tenant';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const IP_FAMILY_LABELS: Record<number, string> = { 1: 'IPv4', 2: 'IPv6' };

type FamilyFilter = 'IPv4' | 'IPv6';
type TenantFilter = 'Shared' | 'Assigned';

// ---------------------------------------------------------------------------
// Assign tenant modal
// ---------------------------------------------------------------------------

const AssignTenantModal = ({ pool, onClose }: { pool: ExternalIPPool; onClose: () => void }) => {
  const { t } = useTranslation();
  const { data: tenants = [] } = useTenants();
  const patch = usePatchExternalIPPool();
  const [tenantId, setTenantId] = useState(pool.metadata?.tenant ?? '');
  const [tenantOpen, setTenantOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const selectedName = tenants.find((tn) => tn.id === tenantId)?.metadata?.name ?? tenantId;
  const unchanged = tenantId === (pool.metadata?.tenant ?? '');

  const onSave = async () => {
    setIsPending(true);
    patch.reset();
    try {
      await patch.mutateAsync({
        id: pool.id,
        patch: { metadata: { tenant: tenantId || undefined } },
      });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="assign-tenant-title"
    >
      <ModalHeader
        title={t('Assign tenant — {{name}}', { name: pool.metadata?.name ?? pool.id })}
        labelId="assign-tenant-title"
      />
      <ModalBody>
        <FormGroup label={t('Tenant')} fieldId="at-tenant">
          <Select
            isOpen={tenantOpen}
            onOpenChange={setTenantOpen}
            selected={tenantId || undefined}
            onSelect={(_e, v) => {
              setTenantId(v as string);
              setTenantOpen(false);
            }}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setTenantOpen(!tenantOpen)}
                isExpanded={tenantOpen}
                style={{ width: '100%' }}
              >
                {tenantId ? selectedName : t('No tenant (shared)')}
              </MenuToggle>
            )}
          >
            <SelectList>
              <SelectOption value="">{t('No tenant (shared)')}</SelectOption>
              {tenants.map((tn) => (
                <SelectOption key={tn.id} value={tn.id}>
                  {tn.metadata?.name ?? tn.id}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>
        {patch.error && (
          <Alert
            variant="danger"
            isInline
            title={t('Failed to update pool')}
            style={{ marginTop: '1rem' }}
          >
            {getErrorMessage(patch.error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          isDisabled={isPending || unchanged}
          isLoading={isPending}
        >
          {t('Save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ProviderIPPoolsPage = () => {
  const { t } = useTranslation();
  const { data: externalPools = [], isLoading, error } = useExternalIPPools();
  const { mutate: deletePool } = useDeleteExternalIPPool();
  const navigate = useNavigate();

  const [assignTarget, setAssignTarget] = useState<ExternalIPPool | null>(null);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [familyFilters, setFamilyFilters] = useState<FamilyFilter[]>([]);
  const [tenantFilters, setTenantFilters] = useState<TenantFilter[]>([]);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return externalPools.filter((pool) => {
      if (q) {
        const name = (pool.metadata?.name ?? pool.id).toLowerCase();
        const spec = pool.spec as typeof pool.spec & { cidr?: string; zone?: string };
        const cidr = (spec?.cidr ?? '').toLowerCase();
        const zone = (spec?.zone ?? '').toLowerCase();
        if (!name.includes(q) && !cidr.includes(q) && !zone.includes(q)) {
          return false;
        }
      }
      if (familyFilters.length > 0) {
        const label = IP_FAMILY_LABELS[pool.spec?.ipFamily ?? 0];
        if (!familyFilters.includes(label as FamilyFilter)) {
          return false;
        }
      }
      if (tenantFilters.length > 0) {
        const isShared = !pool.metadata?.tenant;
        if (tenantFilters.includes('Shared') && !isShared) {
          return false;
        }
        if (tenantFilters.includes('Assigned') && isShared) {
          return false;
        }
      }
      return true;
    });
  }, [externalPools, search, familyFilters, tenantFilters]);

  const toggleFamily = (v: FamilyFilter) =>
    setFamilyFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleTenant = (v: TenantFilter) =>
    setTenantFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setFamilyFilters([]);
    setTenantFilters([]);
  };
  const hasFilters = search || familyFilters.length > 0 || tenantFilters.length > 0;

  return (
    <ListPage
      title={t('IP Pools')}
      description={t('Manage external IP address pools available to tenants.')}
    >
      {assignTarget && (
        <AssignTenantModal pool={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
          <ToolbarContent>
            <ToolbarItem variant="search-filter">
              <SearchInput
                aria-label={t('Search IP pools')}
                placeholder={t('Search by name, CIDR, or zone')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>

            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                labels={familyFilters}
                deleteLabel={(_g, v) => toggleFamily(v as FamilyFilter)}
                deleteLabelGroup={() => setFamilyFilters([])}
                categoryName={t('IP family')}
              >
                <Select
                  isOpen={familyOpen}
                  onOpenChange={setFamilyOpen}
                  onSelect={(_e, v) => {
                    toggleFamily(v as FamilyFilter);
                    setFamilyOpen(false);
                  }}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setFamilyOpen(!familyOpen)}
                      isExpanded={familyOpen}
                      badge={familyFilters.length || undefined}
                    >
                      {t('IP family')}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['IPv4', 'IPv6'] as FamilyFilter[]).map((f) => (
                      <SelectOption
                        key={f}
                        value={f}
                        hasCheckbox
                        isSelected={familyFilters.includes(f)}
                      >
                        {f}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                labels={tenantFilters}
                deleteLabel={(_g, v) => toggleTenant(v as TenantFilter)}
                deleteLabelGroup={() => setTenantFilters([])}
                categoryName={t('Tenant')}
              >
                <Select
                  isOpen={tenantOpen}
                  onOpenChange={setTenantOpen}
                  onSelect={(_e, v) => {
                    toggleTenant(v as TenantFilter);
                    setTenantOpen(false);
                  }}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setTenantOpen(!tenantOpen)}
                      isExpanded={tenantOpen}
                      badge={tenantFilters.length || undefined}
                    >
                      {t('Tenant')}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['Shared', 'Assigned'] as TenantFilter[]).map((tf) => (
                      <SelectOption
                        key={tf}
                        value={tf}
                        hasCheckbox
                        isSelected={tenantFilters.includes(tf)}
                      >
                        {tf}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>

            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/provider/ip-pools/new')}>
                {t('Create pool')}
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>{t('No IP pools match the current filters.')}</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                {t('Clear filters')}
              </Button>
            </FlexItem>
          </Flex>
        ) : externalPools.length === 0 ? (
          <Alert variant="info" isInline title={t('No pools configured')} />
        ) : (
          <Table aria-label={t('IP pools')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('IP family')}</Th>
                <Th>{t('CIDR')}</Th>
                <Th>{t('Zone')}</Th>
                <Th>{t('Available')}</Th>
                <Th>{t('Tenant')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((pool) => {
                const spec = pool.spec as typeof pool.spec & { cidr?: string; zone?: string };
                return (
                  <Tr key={pool.id}>
                    <Td dataLabel={t('Name')}>
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/provider/ip-pools/external/${pool.id}`)}
                      >
                        {pool.metadata?.name ?? pool.id}
                      </Button>
                    </Td>
                    <Td dataLabel={t('IP family')}>
                      <Label color="blue" isCompact>
                        {IP_FAMILY_LABELS[pool.spec?.ipFamily ?? 0] ?? '—'}
                      </Label>
                    </Td>
                    <Td dataLabel={t('CIDR')}>
                      {spec?.cidr ? (
                        <code style={{ fontSize: '0.85em' }}>{spec.cidr}</code>
                      ) : (
                        <span style={{ color: 'var(--pf-t--global--color--200)' }}>—</span>
                      )}
                    </Td>
                    <Td dataLabel={t('Zone')}>{spec?.zone ?? '—'}</Td>
                    <Td dataLabel={t('Available')}>{String(pool.status?.available ?? '—')}</Td>
                    <Td dataLabel={t('Tenant')}>
                      {pool.metadata?.tenant ? (
                        <Label color="purple" isCompact>
                          {pool.metadata.tenant}
                        </Label>
                      ) : (
                        <span style={{ color: 'var(--pf-t--global--color--200)' }}>
                          {t('Shared')}
                        </span>
                      )}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('View details'),
                            onClick: () => navigate(`/provider/ip-pools/external/${pool.id}`),
                          },
                          {
                            title: t('Assign tenant'),
                            onClick: () => setAssignTarget(pool),
                          },
                          {
                            title: t('Delete'),
                            onClick: () => deletePool(pool.id),
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

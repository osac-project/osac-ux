import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Content,
  Divider,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  SearchInput,
  Select,
  SelectOption,
  Stack,
  StackItem,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';
import { useBareMetalInstanceCatalogItems } from '@osac/ui-components/api/v1/baremetal-instance';
import {
  useAllBareMetalInstanceCatalogItems,
  useDeleteBareMetalInstanceCatalogItem,
} from '@osac/ui-components/api/v1/baremetal-instance-catalog-item';
import {
  useAllClusterCatalogItems,
  useClusterCatalogItems,
  useDeleteClusterCatalogItem,
} from '@osac/ui-components/api/v1/cluster-catalog-item';
import {
  useAllComputeInstanceCatalogItems,
  useComputeInstanceCatalogItems,
  useDeleteComputeInstanceCatalogItem,
} from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import {
  useAllMaaSCatalogItems,
  useDeleteMaaSCatalogItem,
  useMaaSCatalogItems,
} from '@osac/ui-components/api/v1/maas-catalog-item';
import { CatalogItemDetailDrawer } from '@osac/ui-components/components/catalog/CatalogItemDetailDrawer';
import type {
  CatalogItemForDisplay,
  CatalogItemKind,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  buildLabelCelFilter,
  collectLabelValues,
  filterCatalogItemsByLabels,
  filterCatalogItemsBySearch,
} from '@osac/ui-components/components/catalog/catalogItemDisplay';
import { CatalogItemListSection } from '@osac/ui-components/components/catalog/CatalogItemListSection';
import { TenantTemplateCustomizeModal } from '@osac/ui-components/components/catalog/TenantTemplateCustomizeModal';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

type CatalogTypeFilter = 'all' | 'vm' | 'cluster' | 'baremetal' | 'maas';

interface SelectedCatalogItem {
  kind: CatalogItemKind;
  item: CatalogItemForDisplay;
}

interface Props {
  isProviderGlobal?: boolean;
  isAdminMode?: boolean;
}

interface CustomizeTarget {
  kind: CatalogItemKind;
  item: ComputeInstanceCatalogItem | ClusterCatalogItem | BareMetalInstanceCatalogItem;
}

export const CatalogPage = ({ isProviderGlobal = false, isAdminMode = false }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CatalogTypeFilter>('all');
  const [osFilter, setOsFilter] = useState('');
  const [archFilter, setArchFilter] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState('');
  const [osOpen, setOsOpen] = useState(false);
  const [archOpen, setArchOpen] = useState(false);
  const [workloadOpen, setWorkloadOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<SelectedCatalogItem | null>(null);
  const [customizeTarget, setCustomizeTarget] = useState<CustomizeTarget | null>(null);

  const catalogTypeFilters = useMemo(
    () =>
      [
        { value: 'all' as const, label: t('All') },
        { value: 'vm' as const, label: t('Virtual machines') },
        { value: 'cluster' as const, label: t('Clusters') },
        { value: 'baremetal' as const, label: t('Bare metal') },
        { value: 'maas' as const, label: t('AI Models') },
      ] satisfies ReadonlyArray<{ value: CatalogTypeFilter; label: string }>,
    [t],
  );

  // Build CEL filter expression for server-side filtering in production
  const labelCelFilter = useMemo(
    () =>
      buildLabelCelFilter({
        ...(osFilter && { os: osFilter }),
        ...(archFilter && { arch: archFilter }),
        ...(workloadFilter && { workload: workloadFilter }),
      }),
    [osFilter, archFilter, workloadFilter],
  );
  const hookParams = useMemo(
    () => (labelCelFilter ? { filter: labelCelFilter } : {}),
    [labelCelFilter],
  );

  const vmPublished = useComputeInstanceCatalogItems(isProviderGlobal ? {} : hookParams, tenantId);
  const vmAll = useAllComputeInstanceCatalogItems(isProviderGlobal ? hookParams : {});
  const {
    data: vmCatalogItemsRaw = [],
    isLoading: vmLoading,
    error: vmError,
  } = isProviderGlobal ? vmAll : vmPublished;

  const clPublished = useClusterCatalogItems(isProviderGlobal ? {} : hookParams, tenantId);
  const clAll = useAllClusterCatalogItems(isProviderGlobal ? hookParams : {});
  const {
    data: clusterCatalogItemsRaw = [],
    isLoading: clusterLoading,
    error: clusterError,
  } = isProviderGlobal ? clAll : clPublished;

  const bmPublished = useBareMetalInstanceCatalogItems(
    isProviderGlobal ? {} : hookParams,
    tenantId,
  );
  const bmAll = useAllBareMetalInstanceCatalogItems(isProviderGlobal ? hookParams : {});
  const {
    data: bmCatalogItemsRaw = [],
    isLoading: bmLoading,
    error: bmError,
  } = isProviderGlobal ? bmAll : bmPublished;

  const maasPublished = useMaaSCatalogItems(isProviderGlobal ? {} : hookParams, tenantId);
  const maasAll = useAllMaaSCatalogItems(isProviderGlobal ? hookParams : {});
  const {
    data: maasCatalogItemsRaw = [],
    isLoading: maasLoading,
    error: maasError,
  } = isProviderGlobal ? maasAll : maasPublished;

  // In admin mode, fetch all items (to find org-scoped ones) and filter accordingly
  const vmAllForAdmin = useAllComputeInstanceCatalogItems();
  const clAllForAdmin = useAllClusterCatalogItems();
  const bmAllForAdmin = useAllBareMetalInstanceCatalogItems();
  const maasAllForAdmin = useAllMaaSCatalogItems();

  // Admin mode: split global vs org-scoped items; other modes: use raw
  const vmCatalogItems = useMemo(
    () =>
      isAdminMode
        ? vmCatalogItemsRaw.filter((ci) => !(ci as { tenant?: string }).tenant)
        : vmCatalogItemsRaw,
    [isAdminMode, vmCatalogItemsRaw],
  );
  const clusterCatalogItems = useMemo(
    () =>
      isAdminMode
        ? clusterCatalogItemsRaw.filter((ci) => !(ci as { tenant?: string }).tenant)
        : clusterCatalogItemsRaw,
    [isAdminMode, clusterCatalogItemsRaw],
  );
  const bmCatalogItems = useMemo(
    () =>
      isAdminMode
        ? bmCatalogItemsRaw.filter((ci) => !(ci as { tenant?: string }).tenant)
        : bmCatalogItemsRaw,
    [isAdminMode, bmCatalogItemsRaw],
  );
  const maasCatalogItems = useMemo(
    () =>
      isAdminMode
        ? maasCatalogItemsRaw.filter((ci) => !(ci as { tenant?: string }).tenant)
        : maasCatalogItemsRaw,
    [isAdminMode, maasCatalogItemsRaw],
  );

  // Org-scoped items (tenant !== '') — shown only in admin mode
  const orgVmItems = useMemo(
    () =>
      isAdminMode
        ? (vmAllForAdmin.data ?? []).filter((ci) => Boolean((ci as { tenant?: string }).tenant))
        : [],
    [isAdminMode, vmAllForAdmin.data],
  );
  const orgClusterItems = useMemo(
    () =>
      isAdminMode
        ? (clAllForAdmin.data ?? []).filter((ci) => Boolean((ci as { tenant?: string }).tenant))
        : [],
    [isAdminMode, clAllForAdmin.data],
  );
  const orgBmItems = useMemo(
    () =>
      isAdminMode
        ? (bmAllForAdmin.data ?? []).filter((ci) => Boolean((ci as { tenant?: string }).tenant))
        : [],
    [isAdminMode, bmAllForAdmin.data],
  );
  const orgMaasItems = useMemo(
    () =>
      isAdminMode
        ? (maasAllForAdmin.data ?? []).filter((ci) => Boolean((ci as { tenant?: string }).tenant))
        : [],
    [isAdminMode, maasAllForAdmin.data],
  );

  const deleteVm = useDeleteComputeInstanceCatalogItem();
  const deleteCluster = useDeleteClusterCatalogItem();
  const deleteBm = useDeleteBareMetalInstanceCatalogItem();
  const deleteMaas = useDeleteMaaSCatalogItem();

  // Derive available OS and arch values across all items (for filter selects)
  const allItems = useMemo(
    () => [vmCatalogItems, clusterCatalogItems, bmCatalogItems, maasCatalogItems],
    [vmCatalogItems, clusterCatalogItems, bmCatalogItems, maasCatalogItems],
  );
  const osOptions = useMemo(() => collectLabelValues(allItems, 'os'), [allItems]);
  const archOptions = useMemo(() => collectLabelValues(allItems, 'arch'), [allItems]);
  const workloadOptions = useMemo(() => collectLabelValues(allItems, 'workload'), [allItems]);

  const showVmCatalog = typeFilter === 'all' || typeFilter === 'vm';
  const showClusterCatalog = typeFilter === 'all' || typeFilter === 'cluster';
  const showBmCatalog = typeFilter === 'all' || typeFilter === 'baremetal';
  const showMaasCatalog = typeFilter === 'all' || typeFilter === 'maas';
  const usePageLevelQueryState = typeFilter !== 'all';

  // Client-side label filter covers demo mode (server-side covers production)
  const labelFilters = useMemo(
    () => ({
      ...(osFilter && { os: osFilter }),
      ...(archFilter && { arch: archFilter }),
      ...(workloadFilter && { workload: workloadFilter }),
    }),
    [osFilter, archFilter, workloadFilter],
  );

  const filteredVmItems = useMemo(
    () =>
      showVmCatalog
        ? filterCatalogItemsByLabels(
            filterCatalogItemsBySearch(vmCatalogItems, search),
            labelFilters,
          )
        : [],
    [showVmCatalog, search, vmCatalogItems, labelFilters],
  );
  const filteredClusterItems = useMemo(
    () =>
      showClusterCatalog
        ? filterCatalogItemsByLabels(
            filterCatalogItemsBySearch(clusterCatalogItems, search),
            labelFilters,
          )
        : [],
    [showClusterCatalog, search, clusterCatalogItems, labelFilters],
  );
  const filteredBmItems = useMemo(
    () =>
      showBmCatalog
        ? filterCatalogItemsByLabels(
            filterCatalogItemsBySearch(bmCatalogItems, search),
            labelFilters,
          )
        : [],
    [showBmCatalog, search, bmCatalogItems, labelFilters],
  );
  const filteredMaasItems = useMemo(
    () =>
      showMaasCatalog
        ? filterCatalogItemsByLabels(
            filterCatalogItemsBySearch(maasCatalogItems, search),
            labelFilters,
          )
        : [],
    [showMaasCatalog, search, maasCatalogItems, labelFilters],
  );

  const isLoading =
    usePageLevelQueryState &&
    ((showVmCatalog && vmLoading) ||
      (showClusterCatalog && clusterLoading) ||
      (showBmCatalog && bmLoading) ||
      (showMaasCatalog && maasLoading));
  const error =
    usePageLevelQueryState &&
    ((showVmCatalog && vmError) ||
      (showClusterCatalog && clusterError) ||
      (showBmCatalog && bmError) ||
      (showMaasCatalog && maasError))
      ? (vmError ?? clusterError ?? bmError ?? maasError)
      : null;

  const hasCatalogItems =
    filteredVmItems.length > 0 ||
    filteredClusterItems.length > 0 ||
    filteredBmItems.length > 0 ||
    filteredMaasItems.length > 0;
  const searchTerm = search.trim();
  const hasActiveFilters = Boolean(osFilter || archFilter || workloadFilter || searchTerm);
  const hasVisibleSections =
    (showVmCatalog && (vmLoading || vmError || filteredVmItems.length > 0)) ||
    (showClusterCatalog && (clusterLoading || clusterError || filteredClusterItems.length > 0)) ||
    (showBmCatalog && (bmLoading || bmError || filteredBmItems.length > 0)) ||
    (showMaasCatalog && (maasLoading || maasError || filteredMaasItems.length > 0));
  const showEmptyState = usePageLevelQueryState
    ? !hasCatalogItems
    : !hasVisibleSections && !vmLoading && !clusterLoading && !bmLoading && !maasLoading;

  const pageDescription = isProviderGlobal
    ? t(
        'Manage all catalog items and control publishing for virtual machines, clusters, and bare metal.',
      )
    : isAdminMode
      ? t('Browse published offerings and customize defaults for your organization.')
      : t(
          'Browse catalog items and launch virtual machines, clusters, or bare metal instances from published offerings.',
        );

  const kindLabel = (kind: CatalogItemKind) => {
    if (kind === 'vm') {
      return (
        <Label isCompact color="blue">
          VM
        </Label>
      );
    }
    if (kind === 'cluster') {
      return (
        <Label isCompact color="purple">
          Cluster
        </Label>
      );
    }
    if (kind === 'maas') {
      return (
        <Label isCompact color="teal">
          AI Model
        </Label>
      );
    }
    return (
      <Label isCompact color="orange">
        BM
      </Label>
    );
  };

  const allOrgItems: Array<{ id: string; kind: CatalogItemKind; title: string; template: string }> =
    useMemo(
      () => [
        ...orgVmItems.map((ci) => ({
          id: ci.id,
          kind: 'vm' as CatalogItemKind,
          title: ci.title,
          template: (ci as { template?: string }).template ?? '—',
        })),
        ...orgClusterItems.map((ci) => ({
          id: ci.id,
          kind: 'cluster' as CatalogItemKind,
          title: ci.title,
          template: (ci as { template?: string }).template ?? '—',
        })),
        ...orgBmItems.map((ci) => ({
          id: ci.id,
          kind: 'baremetal' as CatalogItemKind,
          title: ci.title,
          template: (ci as { template?: string }).template ?? '—',
        })),
        ...orgMaasItems.map((ci) => ({
          id: ci.id,
          kind: 'maas' as CatalogItemKind,
          title: ci.title,
          template: '—',
        })),
      ],
      [orgVmItems, orgClusterItems, orgBmItems, orgMaasItems],
    );

  return (
    <>
      {customizeTarget && (
        <TenantTemplateCustomizeModal
          sourceItem={customizeTarget.item}
          kind={customizeTarget.kind}
          onClose={() => setCustomizeTarget(null)}
          onSuccess={() => {
            setCustomizeTarget(null);
            setSelectedCatalogItem(null);
          }}
        />
      )}
      <ListPage
        title={
          isProviderGlobal ? t('Global catalog') : isAdminMode ? t('Catalog — Admin') : t('Catalog')
        }
        description={pageDescription}
        actions={
          isProviderGlobal ? (
            <Button variant="primary" onClick={() => navigate('/provider/catalog/new')}>
              {t('Create catalog item')}
            </Button>
          ) : undefined
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <CatalogItemDetailDrawer
            item={isProviderGlobal ? null : (selectedCatalogItem?.item ?? null)}
            onClose={() => setSelectedCatalogItem(null)}
            actions={
              isAdminMode && selectedCatalogItem ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const si = selectedCatalogItem;
                    setCustomizeTarget({
                      kind: si.kind,
                      item: si.item as
                        | ComputeInstanceCatalogItem
                        | ClusterCatalogItem
                        | BareMetalInstanceCatalogItem,
                    });
                  }}
                >
                  {t('Customize for my org')}
                </Button>
              ) : selectedCatalogItem?.kind === 'vm' ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/vms/create/${selectedCatalogItem.item.id}`)}
                >
                  {t('Create virtual machine')}
                </Button>
              ) : selectedCatalogItem?.kind === 'cluster' ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/clusters/create/${selectedCatalogItem.item.id}`)}
                >
                  {t('Create cluster')}
                </Button>
              ) : selectedCatalogItem?.kind === 'baremetal' ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/bare-metal/create/${selectedCatalogItem.item.id}`)}
                >
                  {t('Create bare metal instance')}
                </Button>
              ) : selectedCatalogItem?.kind === 'maas' ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/models/create/${selectedCatalogItem.item.id}`)}
                >
                  {t('Request model access')}
                </Button>
              ) : null
            }
          >
            <Stack hasGutter>
              <StackItem>
                <Flex
                  spaceItems={{ default: 'spaceItemsSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  flexWrap={{ default: 'wrap' }}
                >
                  <FlexItem>
                    <SearchInput
                      placeholder={t('Search catalog items')}
                      value={search}
                      onChange={(_event, value) => setSearch(value)}
                      onClear={() => setSearch('')}
                      aria-label={t('Filter catalog by keyword')}
                    />
                  </FlexItem>
                  <FlexItem>
                    <ToggleGroup aria-label={t('Filter catalog by resource type')}>
                      {catalogTypeFilters.map((option) => (
                        <ToggleGroupItem
                          key={option.value}
                          text={option.label}
                          buttonId={`catalog-type-filter-${option.value}`}
                          isSelected={typeFilter === option.value}
                          onChange={() => setTypeFilter(option.value)}
                        />
                      ))}
                    </ToggleGroup>
                  </FlexItem>
                  {osOptions.length > 0 && (
                    <FlexItem>
                      <Select
                        isOpen={osOpen}
                        onOpenChange={setOsOpen}
                        onSelect={(_e, val) => {
                          setOsFilter(val as string);
                          setOsOpen(false);
                        }}
                        selected={osFilter || undefined}
                        toggle={(ref) => (
                          <MenuToggle
                            ref={ref}
                            onClick={() => setOsOpen(!osOpen)}
                            isExpanded={osOpen}
                            variant={osFilter ? 'primary' : 'default'}
                          >
                            {osFilter ? `OS: ${osFilter}` : t('OS')}
                          </MenuToggle>
                        )}
                      >
                        <SelectOption value="">{t('Any OS')}</SelectOption>
                        {osOptions.map((os) => (
                          <SelectOption key={os} value={os}>
                            {os}
                          </SelectOption>
                        ))}
                      </Select>
                    </FlexItem>
                  )}
                  {archOptions.length > 0 && (
                    <FlexItem>
                      <Select
                        isOpen={archOpen}
                        onOpenChange={setArchOpen}
                        onSelect={(_e, val) => {
                          setArchFilter(val as string);
                          setArchOpen(false);
                        }}
                        selected={archFilter || undefined}
                        toggle={(ref) => (
                          <MenuToggle
                            ref={ref}
                            onClick={() => setArchOpen(!archOpen)}
                            isExpanded={archOpen}
                            variant={archFilter ? 'primary' : 'default'}
                          >
                            {archFilter ? `Arch: ${archFilter}` : t('Architecture')}
                          </MenuToggle>
                        )}
                      >
                        <SelectOption value="">{t('Any architecture')}</SelectOption>
                        {archOptions.map((arch) => (
                          <SelectOption key={arch} value={arch}>
                            {arch}
                          </SelectOption>
                        ))}
                      </Select>
                    </FlexItem>
                  )}
                  {workloadOptions.length > 0 && (
                    <FlexItem>
                      <Select
                        isOpen={workloadOpen}
                        onOpenChange={setWorkloadOpen}
                        onSelect={(_e, val) => {
                          setWorkloadFilter(val as string);
                          setWorkloadOpen(false);
                        }}
                        selected={workloadFilter || undefined}
                        toggle={(ref) => (
                          <MenuToggle
                            ref={ref}
                            onClick={() => setWorkloadOpen(!workloadOpen)}
                            isExpanded={workloadOpen}
                            variant={workloadFilter ? 'primary' : 'default'}
                          >
                            {workloadFilter ? `Workload: ${workloadFilter}` : t('Workload')}
                          </MenuToggle>
                        )}
                      >
                        <SelectOption value="">{t('Any workload')}</SelectOption>
                        {workloadOptions.map((w) => (
                          <SelectOption key={w} value={w}>
                            {w}
                          </SelectOption>
                        ))}
                      </Select>
                    </FlexItem>
                  )}
                  {hasActiveFilters && (
                    <FlexItem>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch('');
                          setOsFilter('');
                          setArchFilter('');
                          setWorkloadFilter('');
                        }}
                      >
                        {t('Clear all filters')}
                      </Button>
                    </FlexItem>
                  )}
                </Flex>
              </StackItem>

              {showEmptyState ? (
                <StackItem>
                  <EmptyState titleText={t('No catalog items found')} headingLevel="h2">
                    <EmptyStateBody>
                      {hasActiveFilters
                        ? t('No catalog items match the current filters.')
                        : t('No published catalog items are available yet.')}
                    </EmptyStateBody>
                    {hasActiveFilters && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch('');
                          setOsFilter('');
                          setArchFilter('');
                          setWorkloadFilter('');
                        }}
                      >
                        {t('Clear all filters')}
                      </Button>
                    )}
                  </EmptyState>
                </StackItem>
              ) : (
                <>
                  <CatalogItemListSection
                    title={t('Virtual machines')}
                    kind="vm"
                    items={filteredVmItems}
                    isLoading={showVmCatalog && vmLoading}
                    error={showVmCatalog ? vmError : null}
                    selectedItemId={
                      isProviderGlobal
                        ? null
                        : selectedCatalogItem?.kind === 'vm'
                          ? selectedCatalogItem.item.id
                          : null
                    }
                    onSelectItem={(item) =>
                      isProviderGlobal
                        ? navigate(`/provider/catalog/${item.id}/edit?kind=vm`)
                        : setSelectedCatalogItem({ kind: 'vm', item })
                    }
                  />
                  <CatalogItemListSection
                    title={t('Clusters')}
                    kind="cluster"
                    items={filteredClusterItems}
                    isLoading={showClusterCatalog && clusterLoading}
                    error={showClusterCatalog ? clusterError : null}
                    selectedItemId={
                      isProviderGlobal
                        ? null
                        : selectedCatalogItem?.kind === 'cluster'
                          ? selectedCatalogItem.item.id
                          : null
                    }
                    onSelectItem={(item) =>
                      isProviderGlobal
                        ? navigate(`/provider/catalog/${item.id}/edit?kind=cluster`)
                        : setSelectedCatalogItem({ kind: 'cluster', item })
                    }
                  />
                  <CatalogItemListSection
                    title={t('Bare metal')}
                    kind="baremetal"
                    items={filteredBmItems}
                    isLoading={showBmCatalog && bmLoading}
                    error={showBmCatalog ? bmError : null}
                    selectedItemId={
                      isProviderGlobal
                        ? null
                        : selectedCatalogItem?.kind === 'baremetal'
                          ? selectedCatalogItem.item.id
                          : null
                    }
                    onSelectItem={(item) =>
                      isProviderGlobal
                        ? navigate(`/provider/catalog/${item.id}/edit?kind=baremetal`)
                        : setSelectedCatalogItem({ kind: 'baremetal', item })
                    }
                  />
                  <CatalogItemListSection
                    title={t('AI Models')}
                    kind="maas"
                    items={filteredMaasItems}
                    isLoading={showMaasCatalog && maasLoading}
                    error={showMaasCatalog ? maasError : null}
                    selectedItemId={
                      isProviderGlobal
                        ? null
                        : selectedCatalogItem?.kind === 'maas'
                          ? selectedCatalogItem.item.id
                          : null
                    }
                    onSelectItem={(item) =>
                      isProviderGlobal
                        ? navigate(`/provider/catalog/${item.id}/edit?kind=maas`)
                        : setSelectedCatalogItem({ kind: 'maas', item })
                    }
                  />
                </>
              )}

              {isAdminMode && (
                <StackItem>
                  <Divider style={{ margin: '1.5rem 0 1rem' }} />
                  <Flex
                    justifyContent={{ default: 'justifyContentSpaceBetween' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                    style={{ marginBottom: '0.75rem' }}
                  >
                    <FlexItem>
                      <Title headingLevel="h2" size="lg">
                        {t("My org's templates")}
                      </Title>
                      <Content
                        component="small"
                        style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
                      >
                        {t("Org-scoped catalog items with your organization's defaults pre-set.")}
                      </Content>
                    </FlexItem>
                  </Flex>
                  {allOrgItems.length === 0 ? (
                    <Content>
                      {t(
                        'No org templates yet. Click "Customize for my org" on a catalog item above to create one.',
                      )}
                    </Content>
                  ) : (
                    <Table aria-label={t('Org templates')} variant="compact">
                      <Thead>
                        <Tr>
                          <Th>{t('Kind')}</Th>
                          <Th>{t('Title')}</Th>
                          <Th>{t('Template')}</Th>
                          <Th aria-label={t('Actions')} />
                        </Tr>
                      </Thead>
                      <Tbody>
                        {allOrgItems.map((item) => (
                          <Tr key={item.id}>
                            <Td dataLabel={t('Kind')}>{kindLabel(item.kind)}</Td>
                            <Td dataLabel={t('Title')}>
                              <strong>{item.title}</strong>
                            </Td>
                            <Td dataLabel={t('Template')}>{item.template}</Td>
                            <Td isActionCell>
                              <Button
                                variant="danger"
                                size="sm"
                                isDisabled={
                                  deleteVm.isPending ||
                                  deleteCluster.isPending ||
                                  deleteBm.isPending ||
                                  deleteMaas.isPending
                                }
                                onClick={async () => {
                                  if (item.kind === 'vm') {
                                    await deleteVm.mutateAsync(item.id);
                                  } else if (item.kind === 'cluster') {
                                    await deleteCluster.mutateAsync(item.id);
                                  } else if (item.kind === 'maas') {
                                    await deleteMaas.mutateAsync(item.id);
                                  } else {
                                    await deleteBm.mutateAsync(item.id);
                                  }
                                }}
                              >
                                {t('Delete')}
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </StackItem>
              )}
            </Stack>
          </CatalogItemDetailDrawer>
        </ListPageBody>
      </ListPage>
    </>
  );
};

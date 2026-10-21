import { useSearchParams } from 'react-router-dom';
import {
  FormSelect,
  FormSelectOption,
  Gallery,
  GalleryItem,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { VirtualNetworkState } from '@osac/types';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter.ts';

import VirtualNetworkCard from './VirtualNetworkCard';
import {
  useNatGateways,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
} from '../../api/v1/networking';
import { VirtualNetworkCreateModal } from '../../components/networking/VirtualNetworkCreateModal';
import { VirtualNetworksTable } from '../../components/networking/VirtualNetworksTable';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import ProjectFilter from '../../components/Page/ProjectFilter';
import type { ViewType } from '../../components/Primitives/ViewSwitcher';
import {
  DEFAULT_VIEW_TYPE,
  getViewTypePrefKey,
  isViewType,
} from '../../components/Primitives/ViewSwitcher';
import ViewSwitcher from '../../components/Primitives/ViewSwitcher';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useUserPreferences } from '../../hooks/use-user-preferences';
import { useTranslation } from '../../hooks/useTranslation';

export const VIRTUAL_NETWORKS_VIEW_KEY = 'virtual-networks';
const STATUS_PARAM = 'status';
const CREATE_PARAM = 'create';
const CREATE_VIRTUAL_NETWORK_VALUE = 'virtual-network';

const STATUS_FILTER_OPTIONS = [
  { value: 'ready', state: VirtualNetworkState.READY },
  { value: 'pending', state: VirtualNetworkState.PENDING },
  { value: 'failed', state: VirtualNetworkState.FAILED },
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_OPTIONS)[number]['value'];

const isStatusFilterValue = (value: string): value is StatusFilterValue =>
  STATUS_FILTER_OPTIONS.some((option) => option.value === value);

export const VirtualNetworksListPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const [statusFilter, setStatusFilter] = usePageFilter(STATUS_PARAM);
  const [searchParams, setSearchParams] = useSearchParams();
  const isCreateModalOpen = searchParams.get(CREATE_PARAM) === CREATE_VIRTUAL_NETWORK_VALUE;
  const [viewTypePref] = useUserPreferences(getViewTypePrefKey(VIRTUAL_NETWORKS_VIEW_KEY));
  const viewType: ViewType = isViewType(viewTypePref) ? viewTypePref : DEFAULT_VIEW_TYPE;

  const { data: virtualNetworks = [], isLoading, error } = useVirtualNetworks();
  const { data: allSubnets = [] } = useSubnets();
  const {
    data: allSecurityGroups = [],
    isLoading: isLoadingSecurityGroups,
    error: securityGroupsError,
  } = useSecurityGroups();
  const {
    natGatewaysByVirtualNetworkId,
    isLoading: isLoadingNatGateways,
    error: natGatewaysError,
  } = useNatGateways();

  const subnetCountByVN = allSubnets.reduce(
    (acc, subnet) => {
      const vnId = subnet.spec?.virtualNetwork?.id;
      if (vnId) {
        acc[vnId] = (acc[vnId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const securityGroupCountByVN = allSecurityGroups.reduce(
    (acc, securityGroup) => {
      const vnId = securityGroup.spec?.virtualNetwork?.id;
      if (vnId) {
        acc[vnId] = (acc[vnId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const selectedStatus: StatusFilterValue | 'all' = isStatusFilterValue(statusFilter)
    ? statusFilter
    : 'all';
  const selectedStatusOption = STATUS_FILTER_OPTIONS.find(
    (option) => option.value === selectedStatus,
  );
  const filteredVNs = virtualNetworks.filter((vn) => {
    const name = vn.metadata?.name ?? '';
    const matchesStatus = !selectedStatusOption || vn.status?.state === selectedStatusOption.state;
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pageError = error ?? natGatewaysError ?? securityGroupsError;

  const setCreateModalOpen = (isOpen: boolean) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (isOpen) {
      nextSearchParams.set(CREATE_PARAM, CREATE_VIRTUAL_NETWORK_VALUE);
    } else {
      nextSearchParams.delete(CREATE_PARAM);
    }

    setSearchParams(nextSearchParams);
  };

  return (
    <>
      <ListPage
        title={t('Virtual networks')}
        description={t('Manage virtual networks for your compute instances.')}
        error={pageError}
        actions={
          <CreateButton onClick={() => setCreateModalOpen(true)}>
            {t('Create virtual network')}
          </CreateButton>
        }
      >
        <ListPageBody
          isLoading={isLoading || isLoadingNatGateways || isLoadingSecurityGroups}
          error={pageError}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarGroup>
                <ToolbarItem>
                  <ProjectFilter />
                </ToolbarItem>
                <ToolbarItem>
                  <FormSelect
                    id="virtual-networks-status-filter"
                    value={selectedStatus}
                    onChange={(_event, value) => setStatusFilter(value === 'all' ? '' : value)}
                    aria-label={t('Filter virtual networks by status')}
                  >
                    <FormSelectOption value="all" label={t('All statuses')} />
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <FormSelectOption
                        key={option.value}
                        value={option.value}
                        label={
                          option.value === 'ready'
                            ? t('Ready')
                            : option.value === 'pending'
                              ? t('Provisioning')
                              : t('Failed')
                        }
                      />
                    ))}
                  </FormSelect>
                </ToolbarItem>
                <ToolbarItem>
                  <SearchInput
                    placeholder={t('Search virtual networks')}
                    value={search}
                    onChange={(_e, v) => setSearch(v)}
                    onClear={() => setSearch('')}
                    aria-label={t('Search virtual networks')}
                  />
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarGroup align={{ default: 'alignEnd' }}>
                <ToolbarItem>
                  <ViewSwitcher pageKey={VIRTUAL_NETWORKS_VIEW_KEY} />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>
          {filteredVNs.length === 0 ? (
            <SubtleContent component="p">
              {search || selectedStatus !== 'all'
                ? t('No virtual networks match your search.')
                : t('No virtual networks yet. Create one to get started.')}
            </SubtleContent>
          ) : viewType === 'cards' ? (
            <Gallery
              hasGutter
              minWidths={{ default: '20.875rem' }}
              maxWidths={{ default: '20.875rem' }}
            >
              {filteredVNs.map((vn) => {
                const natGatewayWithAddress = natGatewaysByVirtualNetworkId[vn.id];

                return (
                  <GalleryItem key={vn.id}>
                    <VirtualNetworkCard
                      virtualNetwork={vn}
                      subnetCount={subnetCountByVN[vn.id] || 0}
                      securityGroupCount={securityGroupCountByVN[vn.id] || 0}
                      natGateway={natGatewayWithAddress?.natGateway}
                      natGatewayAddress={natGatewayWithAddress?.address}
                    />
                  </GalleryItem>
                );
              })}
            </Gallery>
          ) : (
            <VirtualNetworksTable
              virtualNetworks={filteredVNs}
              subnetCountByVN={subnetCountByVN}
              securityGroupCountByVN={securityGroupCountByVN}
              natGatewaysByVirtualNetworkId={natGatewaysByVirtualNetworkId}
            />
          )}
        </ListPageBody>
      </ListPage>

      {isCreateModalOpen && <VirtualNetworkCreateModal onClose={() => setCreateModalOpen(false)} />}
    </>
  );
};

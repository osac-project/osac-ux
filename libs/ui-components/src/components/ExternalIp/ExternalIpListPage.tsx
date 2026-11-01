import { useMemo } from 'react';
import {
  Gallery,
  GalleryItem,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import type { ExternalIP } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { useExternalIpsData } from '@osac/ui-components/api/v1/external-ip-data';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { useProjectFilterQuery } from '@osac/ui-components/hooks/use-project-filter-query';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { useUserPreferences } from '../../hooks/use-user-preferences';
import ExternalIpPoolTenantCard from '../ExternalIpPool/ExternalIpPoolTenantCard.tsx';
import ListPage from '../Page/ListPage.tsx';
import ListPageBody from '../Page/ListPageBody.tsx';
import ProjectFilter from '../Page/ProjectFilter.tsx';
import CreateButton from '../Primitives/CreateButton.tsx';
import type { ViewType } from '../Primitives/ViewSwitcher.tsx';
import { DEFAULT_VIEW_TYPE, getViewTypePrefKey, isViewType } from '../Primitives/ViewSwitcher.tsx';
import ViewSwitcher from '../Primitives/ViewSwitcher.tsx';
import { SubtleContent } from '../SubtleContent/SubtleContent.tsx';
import { EXTERNAL_IPS_LIST_PATH } from './CreatePage/values.ts';
import ExternalIpsTable from './ExternalIpsTable.tsx';

export const EXTERNAL_IPS_VIEW_KEY = 'tenant-external-ips';

/** Group a flat ExternalIP list into { poolId → ExternalIP[] } preserving insertion order. */
function groupIpsByPool(externalIps: ExternalIP[]): Map<string, ExternalIP[]> {
  const map = new Map<string, ExternalIP[]>();
  for (const ip of externalIps) {
    const poolId = ip.spec?.pool?.id ?? ip.status?.pool ?? ip.id;
    const group = map.get(poolId);
    if (group) group.push(ip);
    else map.set(poolId, [ip]);
  }
  return map;
}

const ExternalIpListPage = () => {
  const { t } = useTranslation();
  const [viewTypePref] = useUserPreferences(getViewTypePrefKey(EXTERNAL_IPS_VIEW_KEY));
  const viewType: ViewType = isViewType(viewTypePref) ? viewTypePref : DEFAULT_VIEW_TYPE;
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const projectFilter = useProjectFilterQuery<ExternalIP>();

  // Single data fetch — shared by both list and cards views
  const { externalIps, poolsById, attachedTargetsByExternalIpId, isLoading, error } =
    useExternalIpsData({
      filter: cel<ExternalIP>((filter) =>
        filter.and(
          projectFilter,
          search
            ? filter.or(
                filter.field('metadata.name').contains(search),
                filter.field('status.address').contains(search),
              )
            : undefined,
        ),
      ),
    });

  const ipsByPoolId = useMemo(() => groupIpsByPool(externalIps), [externalIps]);

  return (
    <ListPage
      title={t('External IPs')}
      description={t(
        'Review provider-assigned IP pools and allocate external addresses for edge exposure.',
      )}
      error={error}
      actions={
        <CreateButton to={`${EXTERNAL_IPS_LIST_PATH}/create`}>
          {t('Create external IP')}
        </CreateButton>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <ProjectFilter />
              </ToolbarItem>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search external IPs')}
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search external IPs')}
                />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <ViewSwitcher pageKey={EXTERNAL_IPS_VIEW_KEY} />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {externalIps.length === 0 ? (
          <SubtleContent component="p">
            {search || projectFilter
              ? t('No external IPs match your search.')
              : t('No external IPs yet. Create one to get started.')}
          </SubtleContent>
        ) : viewType === 'cards' ? (
          <Gallery
            hasGutter
            minWidths={{ default: '20.875rem' }}
            maxWidths={{ default: '20.875rem' }}
          >
            {[...ipsByPoolId.entries()].map(([poolId, ips]) => {
              const pool = poolsById[poolId];
              if (!pool) return null;
              return (
                <GalleryItem key={poolId}>
                  <ExternalIpPoolTenantCard
                    pool={pool}
                    ips={ips}
                    attachedTargetsByExternalIpId={attachedTargetsByExternalIpId}
                  />
                </GalleryItem>
              );
            })}
          </Gallery>
        ) : (
          <ExternalIpsTable
            externalIps={externalIps}
            poolsById={poolsById}
            attachedTargetsByExternalIpId={attachedTargetsByExternalIpId}
          />
        )}
      </ListPageBody>
    </ListPage>
  );
};

export default ExternalIpListPage;

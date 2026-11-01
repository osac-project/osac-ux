import { useState } from 'react';
import {
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { ClusterState } from '@osac/types';
import { useClusters } from '@osac/ui-components/api/v1/cluster';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import type { ViewType } from '@osac/ui-components/components/Primitives/ViewSwitcher';
import {
  DEFAULT_VIEW_TYPE,
  getViewTypePrefKey,
  isViewType,
} from '@osac/ui-components/components/Primitives/ViewSwitcher';
import ViewSwitcher from '@osac/ui-components/components/Primitives/ViewSwitcher';
import {
  SEARCH_PARAM,
  useArrayPageFilter,
  usePageFilter,
} from '@osac/ui-components/hooks/use-page-filter.ts';
import { useUserPreferences } from '@osac/ui-components/hooks/use-user-preferences';

import ClustersCards from './ClustersCards';
import { ClustersTable } from './ClustersTable';
import ClusterVersionFilter from './ClusterVersionFilter';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import ProjectFilter from '../Page/ProjectFilter';
import { SubtleContent } from '../SubtleContent/SubtleContent';

import './ClustersPage.css';

export const CLUSTERS_VIEW_KEY = 'clusters';
const STATUS_PARAM = 'cluster-status';
const VERSION_PARAM = 'cluster-version';

const STATUS_FILTER_OPTIONS = [
  { value: 'progressing', state: ClusterState.PROGRESSING },
  { value: 'ready', state: ClusterState.READY },
  { value: 'failed', state: ClusterState.FAILED },
  { value: 'deleting', state: ClusterState.DELETING },
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_OPTIONS)[number]['value'];

const isStatusFilterValue = (value: string): value is StatusFilterValue =>
  STATUS_FILTER_OPTIONS.some((option) => option.value === value);

const isClusterVersionFilterValue = (value: string): value is string => value.length > 0;

export const ClustersPage = () => {
  const { t } = useTranslation();
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const [statusFilter, setStatusFilter] = usePageFilter(STATUS_PARAM);
  const [versionFilter, toggleVersionFilter] = useArrayPageFilter(
    VERSION_PARAM,
    isClusterVersionFilterValue,
  );
  const [viewTypePref] = useUserPreferences(getViewTypePrefKey(CLUSTERS_VIEW_KEY));
  const viewType: ViewType = isViewType(viewTypePref) ? viewTypePref : DEFAULT_VIEW_TYPE;
  const { data: clusters = [], isLoading, error } = useClusters();
  const selectedStatus: StatusFilterValue | 'all' = isStatusFilterValue(statusFilter)
    ? statusFilter
    : 'all';
  const selectedStatusOption = STATUS_FILTER_OPTIONS.find(
    (option) => option.value === selectedStatus,
  );
  const versions = [
    ...new Set(
      clusters
        .map((cluster) => cluster.spec?.version?.name)
        .filter((version): version is string => Boolean(version)),
    ),
  ];
  const filteredClusters = clusters.filter((cluster) => {
    const name = cluster.metadata?.name ?? '';
    const matchesStatus =
      !selectedStatusOption || cluster.status?.state === selectedStatusOption.state;
    const matchesVersion =
      versionFilter.length === 0 || versionFilter.includes(cluster.spec?.version?.name ?? '');
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesVersion && matchesSearch;
  });

  return (
    <ListPage
      title={t('Clusters')}
      description={t('OpenShift clusters provisioned for your organization.')}
      error={error}
      actions={<CreateButton to="/clusters/create">{t('Create cluster')}</CreateButton>}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar className="clusters-page__toolbar">
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <ProjectFilter />
              </ToolbarItem>
              <ToolbarItem>
                <Select
                  id="clusters-status-filter"
                  isOpen={isStatusFilterOpen}
                  onOpenChange={setIsStatusFilterOpen}
                  onSelect={(_event, value) => {
                    if (value !== null) {
                      setStatusFilter(value === 'all' ? '' : String(value));
                      setIsStatusFilterOpen(false);
                    }
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isStatusFilterOpen}
                      aria-label={t('Filter clusters by status')}
                      className="clusters-page__status-toggle"
                      onClick={() => setIsStatusFilterOpen((open) => !open)}
                    >
                      {selectedStatusOption
                        ? selectedStatusOption.value === 'progressing'
                          ? t('Provisioning')
                          : selectedStatusOption.value === 'ready'
                            ? t('Ready')
                            : selectedStatusOption.value === 'failed'
                              ? t('Failed')
                              : t('Deleting')
                        : t('All statuses')}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="all">{t('All statuses')}</SelectOption>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectOption key={option.value} value={option.value}>
                        {option.value === 'progressing'
                          ? t('Provisioning')
                          : option.value === 'ready'
                            ? t('Ready')
                            : option.value === 'failed'
                              ? t('Failed')
                              : t('Deleting')}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarItem>
              <ToolbarItem>
                <ClusterVersionFilter
                  selectedVersions={versionFilter}
                  versions={versions}
                  onToggle={toggleVersionFilter}
                />
              </ToolbarItem>
              <ToolbarItem>
                <SearchInput
                  className="clusters-page__search"
                  placeholder={t('Search clusters by name…')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search clusters')}
                />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <ViewSwitcher pageKey={CLUSTERS_VIEW_KEY} />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredClusters.length === 0 ? (
          <SubtleContent component="p">
            {search || selectedStatus !== 'all'
              ? t('No clusters match your search.')
              : t('No clusters yet. Create one to get started.')}
          </SubtleContent>
        ) : viewType === 'cards' ? (
          <ClustersCards clusters={filteredClusters} />
        ) : (
          <ClustersTable clusters={filteredClusters} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

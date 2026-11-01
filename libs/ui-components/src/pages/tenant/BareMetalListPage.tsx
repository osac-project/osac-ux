import {
  FormSelect,
  FormSelectOption,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { BareMetalInstanceState } from '@osac/types';
import {
  useBareMetalInstanceTypes,
  useBareMetalInstances,
} from '@osac/ui-components/api/v1/baremetal-instance';
import BareMetalCards from '@osac/ui-components/components/BareMetalInstance/BareMetalCards';
import { BareMetalTable } from '@osac/ui-components/components/BareMetalInstance/BareMetalTable';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import ProjectFilter from '@osac/ui-components/components/Page/ProjectFilter';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import type { ViewType } from '@osac/ui-components/components/Primitives/ViewSwitcher';
import {
  DEFAULT_VIEW_TYPE,
  getViewTypePrefKey,
  isViewType,
} from '@osac/ui-components/components/Primitives/ViewSwitcher';
import ViewSwitcher from '@osac/ui-components/components/Primitives/ViewSwitcher';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { useUserPreferences } from '@osac/ui-components/hooks/use-user-preferences';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

export const BARE_METAL_VIEW_KEY = 'bare-metal';
const STATUS_PARAM = 'bare-metal-status';

const STATUS_FILTER_OPTIONS = [
  { value: 'provisioning', state: BareMetalInstanceState.PROVISIONING },
  { value: 'running', state: BareMetalInstanceState.RUNNING },
  { value: 'failed', state: BareMetalInstanceState.FAILED },
  { value: 'stopped', state: BareMetalInstanceState.STOPPED },
  { value: 'starting', state: BareMetalInstanceState.STARTING },
  { value: 'stopping', state: BareMetalInstanceState.STOPPING },
  { value: 'deleting', state: BareMetalInstanceState.DELETING },
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_OPTIONS)[number]['value'];

const isStatusFilterValue = (value: string): value is StatusFilterValue =>
  STATUS_FILTER_OPTIONS.some((option) => option.value === value);

export const BareMetalListPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const [statusFilter, setStatusFilter] = usePageFilter(STATUS_PARAM);
  const [viewTypePref] = useUserPreferences(getViewTypePrefKey(BARE_METAL_VIEW_KEY));
  const viewType: ViewType = isViewType(viewTypePref) ? viewTypePref : DEFAULT_VIEW_TYPE;
  const { data: instances = [], isLoading, error } = useBareMetalInstances();
  const { data: instanceTypes = [] } = useBareMetalInstanceTypes(
    viewType === 'cards' || viewType === 'list',
  );
  const selectedStatus: StatusFilterValue | 'all' = isStatusFilterValue(statusFilter)
    ? statusFilter
    : 'all';
  const selectedStatusOption = STATUS_FILTER_OPTIONS.find(
    (option) => option.value === selectedStatus,
  );
  const filteredInstances = instances.filter((instance) => {
    const name = instance.metadata?.name ?? instance.id;
    const matchesStatus =
      !selectedStatusOption || instance.status?.state === selectedStatusOption.state;
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <ListPage
      title={t('Bare Metal')}
      description={t('View and manage your bare metal instances.')}
      error={error}
      actions={<CreateButton to="/bare-metal/create">{t('Provision bare metal')}</CreateButton>}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <ProjectFilter />
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  id="bare-metal-status-filter"
                  value={selectedStatus}
                  onChange={(_event, value) => setStatusFilter(value === 'all' ? '' : value)}
                  aria-label={t('Filter bare metal instances by status')}
                >
                  <FormSelectOption value="all" label={t('All statuses')} />
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <FormSelectOption
                      key={option.value}
                      value={option.value}
                      label={
                        option.value === 'provisioning'
                          ? t('Provisioning')
                          : option.value === 'running'
                            ? t('Running')
                            : option.value === 'failed'
                              ? t('Failed')
                              : option.value === 'stopped'
                                ? t('Stopped')
                                : option.value === 'starting'
                                  ? t('Starting')
                                  : option.value === 'stopping'
                                    ? t('Stopping')
                                    : t('Deleting')
                      }
                    />
                  ))}
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search bare metal instances by name…')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search bare metal instances')}
                />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <ViewSwitcher pageKey={BARE_METAL_VIEW_KEY} />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        {filteredInstances.length === 0 ? (
          <SubtleContent component="p">
            {search || selectedStatus !== 'all'
              ? t('No bare metal instances match your search.')
              : t('No bare metal instances yet. Create one to get started.')}
          </SubtleContent>
        ) : viewType === 'cards' ? (
          <BareMetalCards instances={filteredInstances} instanceTypes={instanceTypes} />
        ) : (
          <BareMetalTable instances={filteredInstances} instanceTypes={instanceTypes} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

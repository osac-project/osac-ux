import { useMemo } from 'react';
import {
  Alert,
  SearchInput,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { ComputeInstance, ComputeInstanceState } from '@osac/types';
import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useInstanceTypes } from '@osac/ui-components/api/v1/instance-types';
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
import VmsCards from '@osac/ui-components/components/vm/VmsCards';
import { VmTable } from '@osac/ui-components/components/vm/VmTable';
import {
  SEARCH_PARAM,
  useArrayPageFilter,
  usePageFilter,
} from '@osac/ui-components/hooks/use-page-filter';
import { useUserPreferences } from '@osac/ui-components/hooks/use-user-preferences';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';
import VmListFilterSelect, {
  type VmListFilterOption,
} from '@osac/ui-components/pages/tenant/VmListFilterSelect';
import { getErrorMessage } from '@osac/ui-components/utils/error';

type VmPowerStateFilter = 'running' | 'stopped' | 'paused';
type VmOperatingSystemFilter = 'linux' | 'windows';
type VmHardwareFilter = 'gpu' | 'host';

const POWER_STATE_FILTER_PARAM = 'powerState';
const OPERATING_SYSTEM_FILTER_PARAM = 'operatingSystem';
const HARDWARE_FILTER_PARAM = 'hardware';
export const VMS_VIEW_KEY = 'vms';

const isVmPowerStateFilter = (value: string): value is VmPowerStateFilter =>
  value === 'running' || value === 'stopped' || value === 'paused';
const isVmOperatingSystemFilter = (value: string): value is VmOperatingSystemFilter =>
  value === 'linux' || value === 'windows';
const isVmHardwareFilter = (value: string): value is VmHardwareFilter =>
  value === 'gpu' || value === 'host';

const vmMatchesPowerStateFilter = (vm: ComputeInstance, filter: VmPowerStateFilter): boolean => {
  const state = vm.status?.state;
  const states: Record<VmPowerStateFilter, ComputeInstanceState> = {
    running: ComputeInstanceState.RUNNING,
    stopped: ComputeInstanceState.STOPPED,
    paused: ComputeInstanceState.PAUSED,
  };
  return state === states[filter];
};

const vmMatchesOperatingSystemFilter = (
  vm: ComputeInstance,
  filter: VmOperatingSystemFilter,
): boolean => {
  const diskImageName = vm.spec?.diskImage?.name?.toLowerCase() ?? '';
  return filter === 'windows'
    ? diskImageName.includes('windows')
    : !diskImageName.includes('windows');
};

const vmMatchesHardwareFilter = (
  vm: ComputeInstance,
  filter: VmHardwareFilter,
  instanceTypes: readonly { id: string; spec?: { gpu?: unknown } }[],
): boolean => {
  const instanceType = instanceTypes.find((type) => type.id === vm.spec?.instanceType?.id);
  const hasGpu = Boolean(instanceType?.spec?.gpu);
  return filter === 'gpu' ? hasGpu : !hasGpu;
};

export const VmListPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const [powerStateFilters, setPowerStateFilters] = useArrayPageFilter(
    POWER_STATE_FILTER_PARAM,
    isVmPowerStateFilter,
  );
  const [operatingSystemFilters, setOperatingSystemFilters] = useArrayPageFilter(
    OPERATING_SYSTEM_FILTER_PARAM,
    isVmOperatingSystemFilter,
  );
  const [hardwareFilters, setHardwareFilters] = useArrayPageFilter(
    HARDWARE_FILTER_PARAM,
    isVmHardwareFilter,
  );
  const [viewTypePref] = useUserPreferences(getViewTypePrefKey(VMS_VIEW_KEY));
  const viewType: ViewType = isViewType(viewTypePref) ? viewTypePref : DEFAULT_VIEW_TYPE;

  const { data: vms = [], isLoading, error } = useComputeInstances();
  const {
    data: instanceTypes = [],
    isLoading: isInstanceTypesLoading,
    error: instanceTypesError,
  } = useInstanceTypes();

  const powerStateOptions: readonly VmListFilterOption<VmPowerStateFilter>[] = [
    { value: 'running', label: t('Running') },
    { value: 'stopped', label: t('Stopped') },
    { value: 'paused', label: t('Paused') },
  ];
  const operatingSystemOptions: readonly VmListFilterOption<VmOperatingSystemFilter>[] = [
    { value: 'linux', label: t('Linux') },
    { value: 'windows', label: t('Windows') },
  ];
  const hardwareOptions: readonly VmListFilterOption<VmHardwareFilter>[] = [
    { value: 'gpu', label: t('GPU devices') },
    { value: 'host', label: t('Host devices') },
  ];

  const filteredVms = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (
      powerStateFilters.length === 0 &&
      operatingSystemFilters.length === 0 &&
      hardwareFilters.length === 0 &&
      !searchTerm
    ) {
      return vms;
    }
    return vms.filter((vm) => {
      const name = vm.metadata?.name ?? '';
      const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm);
      const matchesPowerState =
        !powerStateFilters.length ||
        powerStateFilters.some((filter) => vmMatchesPowerStateFilter(vm, filter));
      const matchesOperatingSystem =
        !operatingSystemFilters.length ||
        operatingSystemFilters.some((filter) => vmMatchesOperatingSystemFilter(vm, filter));
      const matchesHardware =
        !hardwareFilters.length ||
        hardwareFilters.some((filter) => vmMatchesHardwareFilter(vm, filter, instanceTypes));
      return matchesSearch && matchesPowerState && matchesOperatingSystem && matchesHardware;
    });
  }, [hardwareFilters, instanceTypes, operatingSystemFilters, powerStateFilters, search, vms]);

  const showEmptyState = !isLoading && !error && filteredVms.length === 0;

  return (
    <ListPage
      title={t('Virtual machines')}
      description={t('View and filter your virtual machines.')}
      error={error}
      actions={<CreateButton to="/vms/create">{t('Create virtual machine')}</CreateButton>}
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Stack hasGutter>
          <StackItem>
            <Toolbar>
              <ToolbarContent>
                <ToolbarGroup>
                  <ToolbarItem>
                    <ProjectFilter showAllProjectsIcon />
                  </ToolbarItem>
                  <ToolbarItem>
                    <VmListFilterSelect
                      allLabel={t('All power states')}
                      ariaLabel={t('Filter by power state')}
                      options={powerStateOptions}
                      selected={powerStateFilters}
                      onToggle={setPowerStateFilters}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <VmListFilterSelect
                      allLabel={t('All operating systems')}
                      ariaLabel={t('Filter by operating system')}
                      options={operatingSystemOptions}
                      selected={operatingSystemFilters}
                      onToggle={setOperatingSystemFilters}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <VmListFilterSelect
                      allLabel={t('Hardware devices')}
                      ariaLabel={t('Filter by hardware devices')}
                      options={hardwareOptions}
                      selected={hardwareFilters}
                      onToggle={setHardwareFilters}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <SearchInput
                      placeholder={t('Search virtual machines')}
                      value={search}
                      onChange={(_event, value) => setSearch(value)}
                      onClear={() => setSearch('')}
                      aria-label={t('Search virtual machines')}
                      isDisabled={isLoading || !!error}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarGroup align={{ default: 'alignEnd' }}>
                  <ToolbarItem>
                    <ViewSwitcher pageKey={VMS_VIEW_KEY} />
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
          </StackItem>
          {instanceTypesError ? (
            <StackItem>
              <Alert variant="danger" title={t('Could not load instance types')} isInline>
                {getErrorMessage(instanceTypesError)}
              </Alert>
            </StackItem>
          ) : null}
          <StackItem>
            {showEmptyState ? (
              <SubtleContent component="p">
                {powerStateFilters.length === 0 &&
                operatingSystemFilters.length === 0 &&
                hardwareFilters.length === 0
                  ? t('Choose one or more filters above to filter virtual machines.')
                  : search || vms.length > 0
                    ? t('No virtual machines match your search.')
                    : t('No virtual machines yet. Create one to get started.')}
              </SubtleContent>
            ) : viewType === 'cards' ? (
              <VmsCards
                vms={filteredVms}
                instanceTypes={instanceTypes}
                isInstanceTypesLoading={isInstanceTypesLoading}
              />
            ) : (
              <VmTable vms={filteredVms} />
            )}
          </StackItem>
        </Stack>
      </ListPageBody>
    </ListPage>
  );
};

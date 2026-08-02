import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { ComputeInstanceState } from '@osac/types';
import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { VmTable } from '@osac/ui-components/components/vm/VmTable';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import './VmListPage.css';

const POWER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
] as const;

type VmPowerFilter = (typeof POWER_FILTERS)[number]['value'];

const normalizePowerFilter = (value: string | null): VmPowerFilter => {
  if (!value) {
    return 'all';
  }
  return POWER_FILTERS.some((option) => option.value === value) ? (value as VmPowerFilter) : 'all';
};

export const VmListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [powerFilter, setPowerFilter] = useState<VmPowerFilter>(() =>
    normalizePowerFilter(searchParams.get('power')),
  );

  const { data: vms = [], isLoading, error } = useComputeInstances();

  const filteredVms = useMemo(() => {
    return vms.filter((vm) => {
      const name = vm.metadata?.name ?? '';
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const state = vm.status?.state;
      const matchesPower =
        powerFilter === 'all' ||
        (powerFilter === 'running' && state === ComputeInstanceState.RUNNING) ||
        (powerFilter === 'stopped' && state === ComputeInstanceState.STOPPED);
      return matchesSearch && matchesPower;
    });
  }, [powerFilter, search, vms]);

  return (
    <ListPage
      title={t('Virtual machines')}
      description={t('View and filter your virtual machines.')}
      actions={
        role === 'tenantUser' ? (
          <Button variant="primary" onClick={() => navigate('/vms/create')}>
            {t('Create virtual machine')}
          </Button>
        ) : undefined
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          className="osac-vm-list__toolbar"
        >
          <FlexItem>
            <SearchInput
              placeholder={t('Search VMs by name…')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
              className="osac-vm-list__search"
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup
              aria-label={t('Filter virtual machines by status')}
              className="osac-vm-list__status-toggle"
            >
              {POWER_FILTERS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  text={t(option.label)}
                  buttonId={`vm-filter-status-${option.value}`}
                  isSelected={powerFilter === option.value}
                  onChange={() => setPowerFilter(option.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
        </Flex>
        {filteredVms.length === 0 ? (
          <Alert variant="info" isInline title={t('No virtual machines found')}>
            {search || powerFilter !== 'all'
              ? t('No virtual machines match your filters.')
              : t('No virtual machines are provisioned for your organization yet.')}
          </Alert>
        ) : (
          <VmTable vms={filteredVms} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

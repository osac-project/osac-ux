/**
 * flow: bare-metal
 * step: bm_list
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { BareMetalInstance } from '@osac/types';
import { BareMetalInstanceRunStrategy, BareMetalInstanceState } from '@osac/types';

import { useBareMetalInstances } from '../../api/v1/baremetal-instance';
import { resourceComplianceResult } from '../../api/v1/compliance';
import BareMetalDeleteConfirmModal from '../../components/Baremetal/BareMetalDeleteConfirmModal';
import { BareMetalStatusLabel } from '../../components/Baremetal/BareMetalStatusLabel';
import { ComplianceStateLabel } from '../../components/compliance/ComplianceStateLabel';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'failed', label: 'Failed' },
] as const;

type BmStatusFilter = (typeof STATUS_FILTERS)[number]['value'];

const RunStrategyBadge = ({ runStrategy }: { runStrategy?: BareMetalInstanceRunStrategy }) => {
  const { t } = useTranslation();
  switch (runStrategy) {
    case BareMetalInstanceRunStrategy.ALWAYS:
      return (
        <Label color="green" isCompact>
          {t('Always on')}
        </Label>
      );
    case BareMetalInstanceRunStrategy.HALTED:
      return (
        <Label color="orange" isCompact>
          {t('Halted')}
        </Label>
      );
    default:
      return (
        <Label color="grey" isCompact>
          —
        </Label>
      );
  }
};

export const BareMetalListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useSession();
  const { data: instances = [], isLoading, error } = useBareMetalInstances();
  const [instanceToDelete, setInstanceToDelete] = useState<BareMetalInstance | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BmStatusFilter>('all');

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const name = instance.metadata?.name ?? '';
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const state = instance.status?.state;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'running' && state === BareMetalInstanceState.RUNNING) ||
        (statusFilter === 'stopped' && state === BareMetalInstanceState.STOPPED) ||
        (statusFilter === 'failed' && state === BareMetalInstanceState.FAILED);
      return matchesSearch && matchesStatus;
    });
  }, [instances, search, statusFilter]);

  return (
    <ListPage
      title={t('Bare metal')}
      description={t('Physical bare metal instances provisioned for your organization.')}
      actions={
        role === 'tenantUser' ? (
          <Button variant="primary" onClick={() => navigate('/bare-metal/create')}>
            {t('Create bare metal')}
          </Button>
        ) : undefined
      }
    >
      {instanceToDelete && (
        <BareMetalDeleteConfirmModal
          instance={instanceToDelete}
          onClose={() => setInstanceToDelete(null)}
          onSuccess={() => setInstanceToDelete(null)}
        />
      )}
      <ListPageBody isLoading={isLoading} error={error}>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          style={{ marginBottom: '1rem' }}
        >
          <FlexItem>
            <SearchInput
              placeholder={t('Search by name…')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup aria-label={t('Filter bare metal instances by status')}>
              {STATUS_FILTERS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  text={option.label}
                  buttonId={`bm-filter-status-${option.value}`}
                  isSelected={statusFilter === option.value}
                  onChange={() => setStatusFilter(option.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
        </Flex>
        {filteredInstances.length === 0 ? (
          <Alert variant="info" isInline title={t('No bare metal instances found')}>
            {search || statusFilter !== 'all'
              ? t('No bare metal instances match your filters.')
              : t('No bare metal instances are provisioned for your organization yet.')}
          </Alert>
        ) : (
          <Table aria-label={t('Bare metal instances')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('State')}</Th>
                <Th>{t('Compliance')}</Th>
                <Th>{t('Catalog item')}</Th>
                <Th>{t('Run strategy')}</Th>
                <Th>{t('Created')}</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filteredInstances.map((instance) => {
                const name = instance.metadata?.name ?? instance.id;
                const created = instance.metadata?.creationTimestamp
                  ? new Date(
                      instance.metadata.creationTimestamp as unknown as string,
                    ).toLocaleDateString()
                  : '—';

                return (
                  <Tr
                    key={instance.id}
                    isClickable
                    onRowClick={() => navigate(`/bare-metal/${instance.id}`)}
                  >
                    <Td dataLabel={t('Name')}>
                      <Button
                        variant="link"
                        isInline
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bare-metal/${instance.id}`);
                        }}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel={t('State')}>
                      <BareMetalStatusLabel state={instance.status?.state} />
                    </Td>
                    <Td dataLabel={t('Compliance')}>
                      <ComplianceStateLabel result={resourceComplianceResult(instance, 'CIS')} />
                    </Td>
                    <Td dataLabel={t('Catalog item')}>{instance.spec?.catalogItem || '—'}</Td>
                    <Td dataLabel={t('Run strategy')}>
                      <RunStrategyBadge runStrategy={instance.spec?.runStrategy} />
                    </Td>
                    <Td dataLabel={t('Created')}>{created}</Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: (
                              <>
                                <DumpsterIcon /> {t('Delete')}
                              </>
                            ),
                            onClick: (e) => {
                              e.stopPropagation();
                              setInstanceToDelete(instance);
                            },
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

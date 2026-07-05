/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';

import { ClusterState } from '@osac/types';

import { useClusters } from '../../api/v1/cluster';
import { ClustersTable } from '../../components/Cluster/ClustersTable';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'progressing', label: 'Progressing' },
  { value: 'failed', label: 'Failed' },
] as const;

type ClusterStatusFilter = (typeof STATUS_FILTERS)[number]['value'];

export const ClustersPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClusterStatusFilter>('all');

  const { data: clusters = [], isLoading, error } = useClusters();

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      const name = cluster.metadata?.name ?? '';
      const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const state = cluster.status?.state;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ready' && state === ClusterState.READY) ||
        (statusFilter === 'progressing' && state === ClusterState.PROGRESSING) ||
        (statusFilter === 'failed' && state === ClusterState.FAILED);
      return matchesSearch && matchesStatus;
    });
  }, [clusters, search, statusFilter]);

  return (
    <ListPage
      title="Clusters"
      description="OpenShift clusters provisioned for your organization."
      actions={
        <Button variant="primary" onClick={() => navigate('/clusters/create')}>
          Create cluster
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
          style={{ marginBottom: '1rem' }}
        >
          <FlexItem>
            <SearchInput
              placeholder="Search clusters by name…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
          <FlexItem>
            <ToggleGroup aria-label="Filter clusters by status">
              {STATUS_FILTERS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  text={option.label}
                  buttonId={`cluster-filter-status-${option.value}`}
                  isSelected={statusFilter === option.value}
                  onChange={() => setStatusFilter(option.value)}
                />
              ))}
            </ToggleGroup>
          </FlexItem>
        </Flex>

        {filteredClusters.length === 0 ? (
          <Alert variant="info" isInline title="No clusters found">
            {search || statusFilter !== 'all' ? (
              'No clusters match your filters.'
            ) : (
              <>
                No clusters are provisioned for your organization yet.{' '}
                <Button variant="link" isInline onClick={() => navigate('/catalog')}>
                  Browse catalog
                </Button>{' '}
                to create one.
              </>
            )}
          </Alert>
        ) : (
          <ClustersTable clusters={filteredClusters} />
        )}
      </ListPageBody>
    </ListPage>
  );
};

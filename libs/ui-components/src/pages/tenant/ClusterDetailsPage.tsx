/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { useParams } from 'react-router-dom';

import { useCluster } from '../../api/v1/cluster';
import ClusterDetailsPageContent from '../../components/Cluster/Details/ClusterDetailsPageContent';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';

export const ClusterDetailsPage = () => {
  const { clusterId } = useParams() as { clusterId: string };
  const { data: cluster, isLoading, isError, refetch } = useCluster(clusterId);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/clusters"
        parentLabel="Clusters"
        tabLabels={['Overview', 'Conditions']}
        tabsId="cluster-detail-tabs"
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo="/clusters"
        parentLabel="Clusters"
        resourceLabel="cluster"
        variant="load-error"
        onRetry={() => void refetch()}
      />
    );
  }

  if (!cluster) {
    return (
      <ResourceDetailsPageError
        parentTo="/clusters"
        parentLabel="Clusters"
        resourceLabel="cluster"
        variant="not-found"
      />
    );
  }

  return <ClusterDetailsPageContent cluster={cluster} />;
};

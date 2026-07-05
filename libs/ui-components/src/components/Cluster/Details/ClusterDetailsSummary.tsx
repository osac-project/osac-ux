/**
 * flow: cluster-service-catalog
 * step: csc_clusters_list
 */
import NetworkWiredIcon from '@patternfly/react-icons/dist/esm/icons/network-wired-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';
import { ResourceKpiHeader } from '../../Resource/Header';

interface ClusterDetailsSummaryProps {
  cluster: Cluster;
}

const ClusterDetailsSummary = ({ cluster }: ClusterDetailsSummaryProps) => {
  const { t } = useTranslation();

  const nodeSetsSpec = cluster.spec?.nodeSets ?? {};
  const nodeSetsStatus = cluster.status?.nodeSets ?? {};
  const totalWorkers = Object.values(nodeSetsStatus).reduce(
    (sum, nodeSet) => sum + (nodeSet?.size ?? 0),
    0,
  );
  const desiredWorkers = Object.values(nodeSetsSpec).reduce(
    (sum, nodeSet) => sum + (nodeSet?.size ?? 0),
    0,
  );

  const podCidr = displayValue(cluster.spec?.network?.podCidr);
  const serviceCidr = displayValue(cluster.spec?.network?.serviceCidr);

  const workerValue =
    totalWorkers === desiredWorkers ? String(totalWorkers) : `${totalWorkers}/${desiredWorkers}`;

  return (
    <ResourceKpiHeader
      ariaLabel={t('Cluster summary')}
      items={[
        {
          title: t('Worker nodes'),
          icon: ServerIcon,
          value: workerValue,
        },
        {
          title: t('Pod CIDR'),
          icon: NetworkWiredIcon,
          value: podCidr,
        },
        {
          title: t('Service CIDR'),
          icon: NetworkWiredIcon,
          value: serviceCidr,
        },
      ]}
    />
  );
};

export default ClusterDetailsSummary;

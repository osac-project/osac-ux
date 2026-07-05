import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';

interface ClusterNetworkingTabProps {
  cluster: Cluster;
}

const ClusterNetworkingTab = ({ cluster }: ClusterNetworkingTabProps) => {
  const { t } = useTranslation();

  return (
    <Card isFullHeight>
      <CardTitle>{t('Networking')}</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Pod CIDR')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.network?.podCidr)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Service CIDR')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.spec?.network?.serviceCidr)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('API URL')}</DescriptionListTerm>
            <DescriptionListDescription>
              {cluster.status?.apiUrl ? (
                <a href={cluster.status.apiUrl} target="_blank" rel="noopener noreferrer">
                  {cluster.status.apiUrl}
                </a>
              ) : (
                '—'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Console URL')}</DescriptionListTerm>
            <DescriptionListDescription>
              {cluster.status?.consoleUrl ? (
                <a href={cluster.status.consoleUrl} target="_blank" rel="noopener noreferrer">
                  {cluster.status.consoleUrl}
                </a>
              ) : (
                '—'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default ClusterNetworkingTab;

import { Card, CardBody, CardTitle } from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';

interface ClusterConditionsTabProps {
  cluster: Cluster;
}

export const ClusterConditionsTab = ({ cluster }: ClusterConditionsTabProps) => {
  const { t } = useTranslation();
  const conditions = cluster.status?.conditions ?? [];

  return (
    <Card>
      <CardTitle>{t('Conditions')}</CardTitle>
      <CardBody>
        <ResourceConditionsTable
          ariaLabel={t('Cluster conditions')}
          conditions={conditions}
          conditionResourceKind="cluster"
        />
      </CardBody>
    </Card>
  );
};

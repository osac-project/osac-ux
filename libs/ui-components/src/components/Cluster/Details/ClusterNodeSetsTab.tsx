import { Badge, Card, CardBody, CardTitle, Content } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Cluster } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';

interface ClusterNodeSetsTabProps {
  cluster: Cluster;
}

const ClusterNodeSetsTab = ({ cluster }: ClusterNodeSetsTabProps) => {
  const { t } = useTranslation();

  const specNodeSets = cluster.spec?.nodeSets ?? {};
  const statusNodeSets = cluster.status?.nodeSets ?? {};
  const allKeys = Array.from(
    new Set([...Object.keys(specNodeSets), ...Object.keys(statusNodeSets)]),
  );

  return (
    <Card isFullHeight>
      <CardTitle>{t('Node sets')}</CardTitle>
      <CardBody>
        {allKeys.length > 0 ? (
          <Table aria-label={t('Cluster node sets')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Host type')}</Th>
                <Th>{t('Desired')}</Th>
                <Th>{t('Current')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allKeys.map((key) => {
                const spec = specNodeSets[key];
                const status = statusNodeSets[key];
                const desired = spec?.size ?? 0;
                const current = status?.size ?? 0;
                const isDegraded = current < desired;

                return (
                  <Tr key={key}>
                    <Td dataLabel={t('Name')}>{key}</Td>
                    <Td dataLabel={t('Host type')}>
                      {displayValue(spec?.hostType ?? status?.hostType)}
                    </Td>
                    <Td dataLabel={t('Desired')}>{desired}</Td>
                    <Td dataLabel={t('Current')}>
                      {isDegraded ? (
                        <Badge
                          isRead
                          style={{
                            background:
                              'var(--pf-t--global--background--color--status--warning--default)',
                          }}
                        >
                          {current}
                        </Badge>
                      ) : (
                        current
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        ) : (
          <Content component="p">{t('No node sets configured.')}</Content>
        )}
      </CardBody>
    </Card>
  );
};

export default ClusterNodeSetsTab;

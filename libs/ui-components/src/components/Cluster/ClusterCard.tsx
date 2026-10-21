import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import ClusterIcon from '@patternfly/react-icons/dist/esm/icons/cluster-icon';
import ContainerNodeIcon from '@patternfly/react-icons/dist/esm/icons/container-node-icon';

import { ClusterState } from '@osac/types';
import type { Cluster, ClusterVersion } from '@osac/types';

import ClusterActionsMenu from './ClusterActionsMenu';
import ClusterRhoaiLabel from './ClusterRhoaiLabel';
import { ClusterStatusLabel } from './ClusterStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';
import ResourceNameField from '../Resource/ResourceNameField';

import './ClusterCard.css';

interface ClusterCardProps {
  cluster: Cluster;
  clusterVersion?: ClusterVersion;
}

const getNodeSetSummary = (cluster: Cluster): { pools: number; nodes: number } => {
  const nodeSets = Object.values(cluster.spec?.nodeSets ?? {});

  return {
    pools: nodeSets.length,
    nodes: nodeSets.reduce((total, nodeSet) => total + (nodeSet.size ?? 0), 0),
  };
};

const ClusterCard = ({ cluster, clusterVersion }: ClusterCardProps) => {
  const { t } = useTranslation();
  const isDeleting = cluster.status?.state === ClusterState.DELETING;
  const nodeSetSummary = getNodeSetSummary(cluster);
  const version = clusterVersion?.spec?.version ?? cluster.spec?.version?.name;

  return (
    <Card isFullHeight className="cluster-card">
      <CardHeader
        className="cluster-card__header"
        actions={{
          actions: (
            <div className="cluster-card__header-actions">
              <ClusterRhoaiLabel cluster={cluster} />
              <ClusterStatusLabel state={cluster.status?.state} />
              {!isDeleting && <ClusterActionsMenu cluster={cluster} />}
            </div>
          ),
        }}
      >
        <span className="cluster-card__icon" aria-hidden>
          <ClusterIcon />
        </span>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem className="cluster-card__name">
            <ResourceNameField
              resource={cluster}
              detailsUrl={isDeleting ? undefined : `/clusters/${encodeURIComponent(cluster.id)}`}
              nameLinkClassName="cluster-card__title-link"
            />
            <Content component="small" className="cluster-card__secondary-cell">
              {cluster.spec?.catalogItem?.name ?? t('OpenShift cluster')}
            </Content>
          </StackItem>
          <StackItem>
            <dl className="cluster-card__specs-list">
              <div className="cluster-card__spec-row">
                <dt className="cluster-card__spec-label">{t('Cluster version')}</dt>
                <dd className="cluster-card__spec-value">
                  {version ? (
                    <span className="cluster-card__spec-value-with-icon">
                      <ContainerNodeIcon />
                      {version}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="cluster-card__spec-row">
                <dt className="cluster-card__spec-label">{t('Node sets')}</dt>
                <dd className="cluster-card__spec-value">
                  {nodeSetSummary.pools > 0
                    ? t('{{pools}} pools · {{nodes}} nodes', nodeSetSummary)
                    : '—'}
                </dd>
              </div>
            </dl>
          </StackItem>
          <Divider />
          <StackItem>
            <dl className="cluster-card__specs-list">
              <div className="cluster-card__spec-row">
                <dt className="cluster-card__footer-label">{t('Project')}</dt>
                <dd className="cluster-card__footer-value">
                  {cluster.metadata?.project || t('Default')}
                </dd>
              </div>
              <div className="cluster-card__spec-row">
                <dt className="cluster-card__footer-label">{t('Created')}</dt>
                <dd className="cluster-card__footer-value">
                  <Timestamp value={cluster.metadata?.creationTimestamp} />
                </dd>
              </div>
            </dl>
            <div className="cluster-card__console">
              <Button
                variant="primary"
                isBlock
                isDisabled={isDeleting}
                className="cluster-card__console-button"
              >
                {t('Console')}
              </Button>
            </div>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ClusterCard;

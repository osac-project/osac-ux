import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';

import type { ClusterCatalogItem, ClusterVersion, HostType, HostTypeReference } from '@osac/types';
import { useAddOnOperators } from '@osac/ui-components/api/v1/add-on-operators';
import {
  CLUSTER_VERSION_ACTIVE_LIST_FILTER,
  useClusterVersions,
} from '@osac/ui-components/api/v1/cluster-versions';
import { useHostTypes } from '@osac/ui-components/api/v1/host-types';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { catalogFieldPolicyBehavior } from '../../../../catalog/catalogFieldPolicyDisplay';
import {
  clusterNodeSetItemsFromPolicy,
  clusterNodeSetMapPolicy,
  clusterVersionReference,
  findClusterVersionForReference,
  findHostTypeForReference,
  formatClusterCatalogHostTypeLabel,
  formatClusterCatalogVersionLabel,
} from '../../../../catalog/clusterCatalogItemResourceDisplay';

import './ClusterCatalogSummary.css';

interface ClusterCatalogSummaryProps {
  catalogItem: ClusterCatalogItem;
}

const versionLabel = (versions: ClusterVersion[], catalogItem: ClusterCatalogItem): string => {
  const reference = clusterVersionReference(catalogItem.fields);
  return formatClusterCatalogVersionLabel(
    findClusterVersionForReference(versions, reference),
    reference,
  );
};

const hostTypeLabel = (hostTypes: HostType[], reference: HostTypeReference | undefined): string =>
  formatClusterCatalogHostTypeLabel(findHostTypeForReference(hostTypes, reference), reference);

const ClusterCatalogSummary = ({ catalogItem }: ClusterCatalogSummaryProps) => {
  const { t } = useTranslation();
  const { data: versions = [] } = useClusterVersions({
    filter: CLUSTER_VERSION_ACTIVE_LIST_FILTER,
  });
  const { data: hostTypes = [] } = useHostTypes();
  const { data: addOnOperators = [] } = useAddOnOperators();
  const nodeSetsPolicy = clusterNodeSetMapPolicy(catalogItem.fields);
  const nodeSets = clusterNodeSetItemsFromPolicy(nodeSetsPolicy) ?? {};
  const nodeSetEntries = Object.entries(nodeSets).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const nodeSetBehavior = catalogFieldPolicyBehavior(nodeSetsPolicy);

  return (
    <Stack hasGutter className="cluster-catalog-summary">
      <StackItem>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
          <FlexItem className="cluster-catalog-summary__lock" aria-hidden>
            <LockIcon />
          </FlexItem>
          <FlexItem>
            <strong>{t('Pre-configured by admin')}</strong>
          </FlexItem>
        </Flex>
        <h1 className="cluster-catalog-summary__title">
          {catalogItem.title || catalogItem.metadata?.name || catalogItem.id}
        </h1>
      </StackItem>
      <StackItem>
        <Gallery
          hasGutter
          className="cluster-catalog-summary__cards"
        >
          <GalleryItem>
            <Card isPlain className="cluster-catalog-summary__card">
              <CardTitle>{t('Cluster version')}</CardTitle>
              <CardBody>{versionLabel(versions, catalogItem)}</CardBody>
            </Card>
          </GalleryItem>
          <GalleryItem>
            <Card isPlain className="cluster-catalog-summary__card">
              <CardTitle>{t('Node sets')}</CardTitle>
              <CardBody>
                {nodeSetBehavior === 'editable' ? t('Editable') : t('Pre-configured')}
              </CardBody>
            </Card>
          </GalleryItem>
          {nodeSetEntries.map(([name, nodeSet]) => {
            const hostType = findHostTypeForReference(hostTypes, nodeSet.hostType);
            const hostLabel = hostTypeLabel(hostTypes, nodeSet.hostType);
            return (
              <GalleryItem key={name}>
                <Card isPlain className="cluster-catalog-summary__card">
                  <CardTitle>{name}</CardTitle>
                  <CardBody>
                    <div>{hostLabel}</div>
                    <div className="cluster-catalog-summary__secondary">
                      {nodeSet.size > 0
                        ? t('{{count}} nodes', { count: nodeSet.size })
                        : t('Size not configured')}
                    </div>
                    {hostType?.description ? (
                      <div className="cluster-catalog-summary__secondary">
                        {hostType.description}
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              </GalleryItem>
            );
          })}
          <GalleryItem>
            <Card isPlain className="cluster-catalog-summary__card">
              <CardTitle>{t('Add-on operators')}</CardTitle>
              <CardBody>
                <div>
                  {addOnOperators.length > 0
                    ? t('{{count}} available', { count: addOnOperators.length })
                    : t('Not configured')}
                </div>
                <div className="cluster-catalog-summary__secondary">
                  {t('Mock data — catalog binding unavailable')}
                </div>
              </CardBody>
            </Card>
          </GalleryItem>
        </Gallery>
      </StackItem>
    </Stack>
  );
};

export default ClusterCatalogSummary;

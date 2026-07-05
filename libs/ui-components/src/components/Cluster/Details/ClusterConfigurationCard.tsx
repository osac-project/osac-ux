import {
  Badge,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Skeleton,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import { useClusterCatalogItem } from '../../../api/v1/cluster-catalog-item';
import { displayValue } from '../../../utils/detailFormatters';
import { Timestamp } from '../../Primitives/Timestamp';

interface ClusterConfigurationCardProps {
  cluster: Cluster;
}

/** Extracts a clean version string from a release image URL.
 *  e.g. "quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64" → "4.17.0" */
function parseOcpVersion(releaseImage?: string): string | undefined {
  if (!releaseImage) {
    return undefined;
  }
  const tag = releaseImage.split(':')[1];
  if (!tag) {
    return undefined;
  }
  // Remove any arch suffix like "-x86_64" or "-multi"
  const match = tag.match(/^(\d+\.\d+\.\d+)/);
  return match?.[1];
}

export const ClusterConfigurationCard = ({ cluster }: ClusterConfigurationCardProps) => {
  const catalogItemId = cluster.spec?.catalogItem;
  const { data: catalogItem, isLoading: isCatalogItemLoading } =
    useClusterCatalogItem(catalogItemId);

  const ocpVersion = parseOcpVersion(cluster.spec?.releaseImage);

  return (
    <Card isFullHeight>
      <CardTitle>Cluster configuration</CardTitle>
      <CardBody>
        <DescriptionList isCompact columnModifier={{ default: '2Col', lg: '3Col' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog item</DescriptionListTerm>
            <DescriptionListDescription>
              {isCatalogItemLoading ? (
                <Skeleton width="150px" />
              ) : (
                displayValue(catalogItem?.metadata?.name ?? catalogItemId)
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>OCP version</DescriptionListTerm>
            <DescriptionListDescription>
              {ocpVersion ? (
                <Flex
                  alignItems={{ default: 'alignItemsCenter' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                >
                  <FlexItem>
                    <Badge isRead>{ocpVersion}</Badge>
                  </FlexItem>
                  <FlexItem>
                    <span
                      style={{
                        fontSize: 'var(--pf-t--global--font--size--sm)',
                        color: 'var(--pf-t--global--text--color--subtle)',
                      }}
                    >
                      {cluster.spec?.releaseImage}
                    </span>
                  </FlexItem>
                </Flex>
              ) : (
                displayValue(cluster.spec?.releaseImage)
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={cluster.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Creator</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(cluster.metadata?.creator)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>API URL</DescriptionListTerm>
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
            <DescriptionListTerm>Console URL</DescriptionListTerm>
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

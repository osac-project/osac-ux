/**
 * flow: cluster-service-catalog
 * step: csc_cluster_detail
 */
import { useState } from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import type { Cluster } from '@osac/types';

import ClusterDetailsActionButtons from './ClusterDetailsActionButtons';
import ClusterDetailsSummary from './ClusterDetailsSummary';
import ClusterNodeSetsTab from './ClusterNodeSetsTab';
import { ClusterOverviewTab } from './ClusterOverviewTab';
import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';
import { ClusterStatusLabel } from '../ClusterStatusLabel';

interface ClusterDetailViewProps {
  cluster: Cluster;
}

const CLUSTER_DETAIL_OVERVIEW_TAB_ID = 'cluster-detail-overview';
const CLUSTER_DETAIL_NODE_SETS_TAB_ID = 'cluster-detail-node-sets';

const ClusterDetailsPageContent = ({ cluster }: ClusterDetailViewProps) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = useState(0);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <ResourceDetailHeader
                  parentTo="/clusters"
                  parentLabel={t('Clusters')}
                  resourceName={cluster.metadata?.name ?? cluster.id}
                  titleAddon={<ClusterStatusLabel state={cluster.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <ClusterDetailsActionButtons cluster={cluster} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <ClusterDetailsSummary cluster={cluster} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTabKey}
              onSelect={(_event, tabIndex) => setActiveTabKey(Number(tabIndex))}
              id="cluster-detail-tabs"
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={CLUSTER_DETAIL_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Node sets')}</TabTitleText>}
                tabContentId={CLUSTER_DETAIL_NODE_SETS_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <TabContent
              eventKey={0}
              id={CLUSTER_DETAIL_OVERVIEW_TAB_ID}
              activeKey={activeTabKey}
              hidden={0 !== activeTabKey}
            >
              <TabContentBody>
                <Stack hasGutter>
                  <StackItem>
                    <ClusterOverviewTab cluster={cluster} />
                  </StackItem>
                  <StackItem>
                    <Card>
                      <CardTitle>{t('Conditions')}</CardTitle>
                      <CardBody>
                        <ResourceConditionsTable
                          ariaLabel={t('Cluster conditions')}
                          conditions={cluster.status?.conditions ?? []}
                          conditionResourceKind="cluster"
                        />
                      </CardBody>
                    </Card>
                  </StackItem>
                </Stack>
              </TabContentBody>
            </TabContent>
            <TabContent
              eventKey={1}
              id={CLUSTER_DETAIL_NODE_SETS_TAB_ID}
              activeKey={activeTabKey}
              hidden={1 !== activeTabKey}
            >
              <TabContentBody>
                <ClusterNodeSetsTab cluster={cluster} />
              </TabContentBody>
            </TabContent>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default ClusterDetailsPageContent;

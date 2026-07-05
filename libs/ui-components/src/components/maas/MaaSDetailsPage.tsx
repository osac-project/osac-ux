/**
 * flow: maas-detail
 * step: maas_detail
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
  PageSection,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';

import { useMaaSCatalogItem } from '@osac/ui-components/api/v1/maas-catalog-item';
import { useModelAccess, useRevokeModelAccess } from '@osac/ui-components/api/v1/maas-instance';
import type { ModelAccessState } from '@osac/ui-components/api/v1/maas-types';

import { MaaSDetailsSummary } from './MaaSDetailsSummary';
import { Timestamp } from '../Primitives/Timestamp';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';

const MAAS_OVERVIEW_TAB_ID = 'maas-detail-overview';
const MAAS_USAGE_TAB_ID = 'maas-detail-usage';

const ModelAccessStateLabel = ({ state }: { state: ModelAccessState | undefined }) => {
  switch (state) {
    case 'ACTIVE':
      return (
        <Label isCompact color="green">
          Active
        </Label>
      );
    case 'PROVISIONING':
      return (
        <Label isCompact color="blue">
          Provisioning
        </Label>
      );
    case 'REVOKED':
      return (
        <Label isCompact color="grey">
          Revoked
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          Unknown
        </Label>
      );
  }
};

const MaskedApiKey = ({ apiKey }: { apiKey: string | undefined }) => {
  if (!apiKey) {
    return <span>—</span>;
  }
  return (
    <ClipboardCopy
      variant={ClipboardCopyVariant.inline}
      isCode
      hoverTip="Copy API key"
      clickTip="Copied!"
    >
      {apiKey}
    </ClipboardCopy>
  );
};

export const MaaSDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: access, isLoading, isError } = useModelAccess(id);
  const { data: catalogItem, isLoading: isCatalogLoading } = useMaaSCatalogItem(
    access?.spec?.catalogItem,
  );
  const { mutate: revoke, isPending: revoking, error: revokeError } = useRevokeModelAccess();

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/models"
        parentLabel="AI Models"
        tabLabels={['Overview', 'Usage']}
        tabsId="maas-detail-tabs"
      />
    );
  }

  if (isError || !access) {
    return (
      <ResourceDetailsPageError
        parentTo="/models"
        parentLabel="AI Models"
        resourceLabel="model access"
        variant={isError ? 'load-error' : 'not-found'}
      />
    );
  }

  const resourceName = access.spec?.applicationName ?? access.metadata?.name ?? access.id;
  const state = access.status?.state;
  const isRevoked = state === 'REVOKED';

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
                  parentTo="/models"
                  parentLabel="AI Models"
                  resourceName={resourceName}
                  titleAddon={<ModelAccessStateLabel state={state} />}
                />
              </FlexItem>
              <FlexItem>
                <Button
                  variant="danger"
                  isDisabled={isRevoked || revoking}
                  isLoading={revoking}
                  onClick={() => revoke(access.id)}
                >
                  Revoke access
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>

          {revokeError && (
            <StackItem>
              <Alert variant="danger" isInline title="Failed to revoke access">
                {revokeError instanceof Error ? revokeError.message : String(revokeError)}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <MaaSDetailsSummary access={access} catalogItem={catalogItem} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, key) => setActiveTab(Number(key))}
              id="maas-detail-tabs"
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>Overview</TabTitleText>}
                tabContentId={MAAS_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>Usage</TabTitleText>}
                tabContentId={MAAS_USAGE_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem md={6}>
            <TabContent
              eventKey={0}
              id={MAAS_OVERVIEW_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 0}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>Access details</CardTitle>
                  <CardBody>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Application name</DescriptionListTerm>
                        <DescriptionListDescription>{resourceName}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Status</DescriptionListTerm>
                        <DescriptionListDescription>
                          <ModelAccessStateLabel state={state} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Model</DescriptionListTerm>
                        <DescriptionListDescription>
                          {isCatalogLoading
                            ? '…'
                            : (catalogItem?.title ?? access.spec?.catalogItem ?? '—')}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Created</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Timestamp value={access.metadata?.creationTimestamp} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Creator</DescriptionListTerm>
                        <DescriptionListDescription>
                          {access.metadata?.creator ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>

            <TabContent
              eventKey={1}
              id={MAAS_USAGE_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 1}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>Token Usage</CardTitle>
                  <CardBody>
                    <Alert
                      variant="info"
                      isInline
                      isPlain
                      title="Estimated — metrics not yet active (Milestone 0.4)"
                    >
                      Usage data (input tokens, output tokens, cached tokens) will appear here once
                      the metering service is available.
                    </Alert>
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>
          </GridItem>

          <GridItem md={6}>
            <TabContent
              eventKey={0}
              id={`${MAAS_OVERVIEW_TAB_ID}-credentials`}
              activeKey={activeTab}
              hidden={activeTab !== 0}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>Credentials</CardTitle>
                  <CardBody>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Endpoint URL</DescriptionListTerm>
                        <DescriptionListDescription>
                          {access.status?.endpoint ? (
                            <ClipboardCopy
                              variant={ClipboardCopyVariant.inline}
                              isCode
                              hoverTip="Copy endpoint"
                              clickTip="Copied!"
                            >
                              {access.status.endpoint}
                            </ClipboardCopy>
                          ) : (
                            '—'
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>API key</DescriptionListTerm>
                        <DescriptionListDescription>
                          <MaskedApiKey apiKey={access.status?.apiKey} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Monthly token quota</DescriptionListTerm>
                        <DescriptionListDescription>
                          {access.spec?.tokenQuotaMonthly
                            ? `${access.spec.tokenQuotaMonthly.toLocaleString()} tokens`
                            : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

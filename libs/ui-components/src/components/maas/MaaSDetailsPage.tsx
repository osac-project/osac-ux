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
  CodeBlock,
  CodeBlockCode,
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
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { MaaSDetailsSummary } from './MaaSDetailsSummary';
import { ResourceUsageCard } from '../metering/ResourceUsageCard';
import { Timestamp } from '../Primitives/Timestamp';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';

const MAAS_OVERVIEW_TAB_ID = 'maas-detail-overview';
const MAAS_USAGE_TAB_ID = 'maas-detail-usage';

const ModelAccessStateLabel = ({ state }: { state: ModelAccessState | undefined }) => {
  const { t } = useTranslation();
  switch (state) {
    case 'ACTIVE':
      return (
        <Label isCompact color="green">
          {t('Active')}
        </Label>
      );
    case 'PROVISIONING':
      return (
        <Label isCompact color="blue">
          {t('Provisioning')}
        </Label>
      );
    case 'REVOKED':
      return (
        <Label isCompact color="grey">
          {t('Revoked')}
        </Label>
      );
    default:
      return (
        <Label isCompact color="grey">
          {t('Unknown')}
        </Label>
      );
  }
};

const MaskedApiKey = ({ apiKey }: { apiKey: string | undefined }) => {
  const { t } = useTranslation();
  if (!apiKey) {
    return <span>—</span>;
  }
  return (
    <ClipboardCopy
      variant={ClipboardCopyVariant.inline}
      isCode
      hoverTip={t('Copy API key')}
      clickTip={t('Copied!')}
    >
      {apiKey}
    </ClipboardCopy>
  );
};

export const MaaSDetailsPage = () => {
  const { t } = useTranslation();
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
        parentLabel={t('AI Models')}
        tabLabels={[t('Overview'), t('Usage')]}
        tabsId="maas-detail-tabs"
      />
    );
  }

  if (isError || !access) {
    return (
      <ResourceDetailsPageError
        parentTo="/models"
        parentLabel={t('AI Models')}
        resourceLabel={t('model access')}
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
                  parentLabel={t('AI Models')}
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
                  {t('Revoke access')}
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>

          {revokeError && (
            <StackItem>
              <Alert variant="danger" isInline title={t('Failed to revoke access')}>
                {revokeError instanceof Error ? revokeError.message : String(revokeError)}
              </Alert>
            </StackItem>
          )}

          {access.status?.endpoint && (
            <StackItem>
              <Card isCompact isPlain>
                <CardBody>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {t('Inference endpoint')}
                  </p>
                  <ClipboardCopy
                    isReadOnly
                    isCode
                    hoverTip={t('Copy endpoint')}
                    clickTip={t('Copied!')}
                    variant={ClipboardCopyVariant.expansion}
                  >
                    {access.status.endpoint}
                  </ClipboardCopy>
                </CardBody>
              </Card>
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
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={MAAS_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Usage')}</TabTitleText>}
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
                  <CardTitle>{t('Access details')}</CardTitle>
                  <CardBody>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Application name')}</DescriptionListTerm>
                        <DescriptionListDescription>{resourceName}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <ModelAccessStateLabel state={state} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Model')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {isCatalogLoading
                            ? '…'
                            : (catalogItem?.title ?? access.spec?.catalogItem ?? '—')}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Timestamp value={access.metadata?.creationTimestamp} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Creator')}</DescriptionListTerm>
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
                <ResourceUsageCard
                  resourceId={access.id}
                  tenantId={access.metadata?.tenant}
                  title={t('Token usage')}
                />
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
                  <CardTitle>{t('Credentials')}</CardTitle>
                  <CardBody>
                    <DescriptionList isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Endpoint URL')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {access.status?.endpoint ? (
                            <ClipboardCopy
                              variant={ClipboardCopyVariant.inline}
                              isCode
                              hoverTip={t('Copy endpoint')}
                              clickTip={t('Copied!')}
                            >
                              {access.status.endpoint}
                            </ClipboardCopy>
                          ) : (
                            '—'
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('API key')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <MaskedApiKey apiKey={access.status?.apiKey} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Monthly token quota')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {access.spec?.tokenQuotaMonthly
                            ? t('{{quota}} tokens', {
                                quota: access.spec.tokenQuotaMonthly.toLocaleString(),
                              })
                            : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>

                {access.status?.endpoint && (
                  <Card isFullHeight style={{ marginTop: '1rem' }}>
                    <CardTitle>{t('How to call this model')}</CardTitle>
                    <CardBody>
                      <p style={{ marginBottom: '0.5rem' }}>
                        {t(
                          'Send OpenAI-compatible requests to the gateway endpoint using your API key as a bearer token:',
                        )}
                      </p>
                      <CodeBlock>
                        <CodeBlockCode id="maas-curl-snippet">
                          {`curl -X POST '${access.status.endpoint}/chat/completions' \\
  -H "Authorization: Bearer ${access.status?.apiKey ?? '<API_KEY>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${catalogItem?.title ?? access.spec?.catalogItem ?? 'model'}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                        </CodeBlockCode>
                      </CodeBlock>
                    </CardBody>
                  </Card>
                )}
              </TabContentBody>
            </TabContent>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

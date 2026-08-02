/**
 * flow: bare-metal
 * step: bm_detail
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
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
  Skeleton,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import PowerOffIcon from '@patternfly/react-icons/dist/esm/icons/power-off-icon';
import RedoIcon from '@patternfly/react-icons/dist/esm/icons/redo-icon';

import type { BareMetalInstance } from '@osac/types';
import {
  BareMetalInstanceConditionType,
  BareMetalInstanceRunStrategy,
  BareMetalInstanceState,
  ConditionStatus,
} from '@osac/types';

import BareMetalDeleteConfirmModal from './BareMetalDeleteConfirmModal';
import { BareMetalDetailsSummary } from './BareMetalDetailsSummary';
import { BareMetalStatusLabel } from './BareMetalStatusLabel';
import {
  useBareMetalInstance,
  useBareMetalInstanceCatalogItem,
  usePatchBareMetalInstance,
} from '../../api/v1/baremetal-instance';
import { ConsoleResourceType } from '../../api/v1/console';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';
import { ResourceConditionsTable } from '../Resource/ResourceConditionsTable';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';
import { VmConsoleTab } from '../vm/DetailsPage/VmConsoleTab';

const BM_OVERVIEW_TAB_ID = 'bm-detail-overview';
const BM_POWER_TAB_ID = 'bm-detail-power';
const BM_CONDITIONS_TAB_ID = 'bm-detail-conditions';
const BM_CONSOLE_TAB_ID = 'bm-detail-console';

const RunStrategyLabel = ({ runStrategy }: { runStrategy?: BareMetalInstanceRunStrategy }) => {
  const { t } = useTranslation();
  switch (runStrategy) {
    case BareMetalInstanceRunStrategy.ALWAYS:
      return (
        <Label color="green" isCompact>
          {t('Always on')}
        </Label>
      );
    case BareMetalInstanceRunStrategy.HALTED:
      return (
        <Label color="orange" isCompact>
          {t('Halted')}
        </Label>
      );
    default:
      return (
        <Label color="grey" isCompact>
          {t('Unspecified')}
        </Label>
      );
  }
};

const getRestartConditions = (conditions: { type: number; status: number; message?: string }[]) =>
  conditions.filter((c) =>
    [
      BareMetalInstanceConditionType.RESTART_IN_PROGRESS,
      BareMetalInstanceConditionType.RESTART_FAILED,
      BareMetalInstanceConditionType.RESTART_REQUIRED,
    ].includes(c.type),
  );

export const BareMetalDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: instance, isLoading, isError } = useBareMetalInstance(id);
  const { data: catalogItem, isLoading: isCatalogLoading } = useBareMetalInstanceCatalogItem(
    instance?.spec?.catalogItem,
  );
  const { mutate: patch, isPending: isPatching, error: patchError } = usePatchBareMetalInstance();

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo="/bare-metal"
        parentLabel={t('Bare metal')}
        tabLabels={[t('Overview'), t('Power management'), t('Conditions'), t('Console')]}
        tabsId="bm-detail-tabs"
      />
    );
  }

  if (isError || !instance) {
    return (
      <ResourceDetailsPageError
        parentTo="/bare-metal"
        parentLabel={t('Bare metal')}
        resourceLabel={t('bare metal instance')}
        variant={isError ? 'load-error' : 'not-found'}
      />
    );
  }

  const resourceName = instance.metadata?.name ?? instance.id;
  const state = instance.status?.state ?? BareMetalInstanceState.UNSPECIFIED;
  const runStrategy = instance.spec?.runStrategy;
  const conditions = instance.status?.conditions ?? [];
  const restartConditions = getRestartConditions(
    conditions as { type: number; status: number; message?: string }[],
  );
  const isRestartInProgress = restartConditions.some(
    (c) =>
      c.type === BareMetalInstanceConditionType.RESTART_IN_PROGRESS &&
      c.status === ConditionStatus.TRUE,
  );

  type SpecPatch = NonNullable<BareMetalInstance['spec']>;

  const togglePower = () => {
    const newStrategy =
      runStrategy === BareMetalInstanceRunStrategy.HALTED
        ? BareMetalInstanceRunStrategy.ALWAYS
        : BareMetalInstanceRunStrategy.HALTED;
    patch({ id: instance.id, patch: { spec: { runStrategy: newStrategy } as SpecPatch } });
  };

  const triggerRestart = () => {
    const currentTrigger = instance.spec?.restartTrigger ?? BigInt(0);
    patch({
      id: instance.id,
      patch: { spec: { restartTrigger: currentTrigger + BigInt(1) } as SpecPatch },
    });
  };

  return (
    <>
      {deleteOpen && (
        <BareMetalDeleteConfirmModal
          instance={instance}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/bare-metal', { replace: true })}
        />
      )}

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
                  parentTo="/bare-metal"
                  parentLabel={t('Bare metal')}
                  resourceName={resourceName}
                  titleAddon={<BareMetalStatusLabel state={state} />}
                />
              </FlexItem>
              <FlexItem>
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<PowerOffIcon />}
                      isLoading={isPatching}
                      isDisabled={isPatching}
                      onClick={togglePower}
                    >
                      {runStrategy === BareMetalInstanceRunStrategy.HALTED
                        ? t('Power on')
                        : t('Power off')}
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<RedoIcon />}
                      isLoading={isRestartInProgress}
                      isDisabled={isPatching || isRestartInProgress}
                      onClick={triggerRestart}
                    >
                      {t('Restart')}
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="danger"
                      icon={<DumpsterIcon />}
                      onClick={() => setDeleteOpen(true)}
                    >
                      {t('Delete')}
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <BareMetalDetailsSummary instance={instance} catalogItem={catalogItem} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, key) => setActiveTab(Number(key))}
              id="bm-detail-tabs"
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={BM_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Power management')}</TabTitleText>}
                tabContentId={BM_POWER_TAB_ID}
              />
              <Tab
                eventKey={2}
                title={<TabTitleText>{t('Conditions')}</TabTitleText>}
                tabContentId={BM_CONDITIONS_TAB_ID}
              />
              <Tab
                eventKey={3}
                title={<TabTitleText>{t('Console')}</TabTitleText>}
                tabContentId={BM_CONSOLE_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem span={12}>
            {/* Overview tab */}
            <TabContent
              eventKey={0}
              id={BM_OVERVIEW_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 0}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>{t('Overview')}</CardTitle>
                  <CardBody>
                    <DescriptionList isCompact columnModifier={{ default: '2Col', lg: '3Col' }}>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('ID')}</DescriptionListTerm>
                        <DescriptionListDescription>{instance.id}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                        <DescriptionListDescription>{resourceName}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('State')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <BareMetalStatusLabel state={state} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {isCatalogLoading ? (
                            <Skeleton width="150px" />
                          ) : (
                            (catalogItem?.title ?? instance.spec?.catalogItem ?? '—')
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {instance.spec?.sshPublicKey ? '••••••' : '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Timestamp value={instance.metadata?.creationTimestamp} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Creator')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {instance.metadata?.creator ?? '—'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>

            {/* Power management tab */}
            <TabContent
              eventKey={1}
              id={BM_POWER_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 1}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>{t('Power management')}</CardTitle>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Run strategy')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              <RunStrategyLabel runStrategy={runStrategy} />
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Restart trigger')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {String(instance.spec?.restartTrigger ?? '0')}{' '}
                              <span
                                style={{
                                  color: 'var(--pf-t--global--text--color--subtle)',
                                  fontSize: 'var(--pf-t--global--font--size--sm)',
                                }}
                              >
                                {t('(acknowledged: {{value}})', {
                                  value: String(instance.status?.restartTrigger ?? '0'),
                                })}
                              </span>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>

                      {restartConditions.length > 0 && (
                        <StackItem>
                          <Stack hasGutter>
                            {restartConditions.map((c, idx) => {
                              const isActive = c.status === ConditionStatus.TRUE;
                              const label =
                                c.type === BareMetalInstanceConditionType.RESTART_IN_PROGRESS
                                  ? t('Restart in progress')
                                  : c.type === BareMetalInstanceConditionType.RESTART_FAILED
                                    ? t('Restart failed')
                                    : t('Restart required');
                              return (
                                <StackItem key={idx}>
                                  <Alert
                                    variant={
                                      c.type === BareMetalInstanceConditionType.RESTART_FAILED
                                        ? 'danger'
                                        : 'info'
                                    }
                                    isInline
                                    isPlain={!isActive}
                                    title={label}
                                  >
                                    {c.message}
                                  </Alert>
                                </StackItem>
                              );
                            })}
                          </Stack>
                        </StackItem>
                      )}

                      {patchError && (
                        <StackItem>
                          <Alert variant="danger" isInline title={t('Operation failed')}>
                            {patchError instanceof Error ? patchError.message : String(patchError)}
                          </Alert>
                        </StackItem>
                      )}

                      <StackItem>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Button
                              variant={
                                runStrategy === BareMetalInstanceRunStrategy.HALTED
                                  ? 'primary'
                                  : 'secondary'
                              }
                              icon={<PowerOffIcon />}
                              isLoading={isPatching}
                              isDisabled={isPatching}
                              onClick={togglePower}
                            >
                              {runStrategy === BareMetalInstanceRunStrategy.HALTED
                                ? t('Power on')
                                : t('Power off')}
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button
                              variant="secondary"
                              icon={<RedoIcon />}
                              isLoading={isRestartInProgress}
                              isDisabled={isPatching || isRestartInProgress}
                              onClick={triggerRestart}
                            >
                              {t('Restart')}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>

            {/* Conditions tab */}
            <TabContent
              eventKey={2}
              id={BM_CONDITIONS_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 2}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>{t('Conditions')}</CardTitle>
                  <CardBody>
                    <ResourceConditionsTable
                      ariaLabel={t('Bare metal instance conditions')}
                      conditions={conditions}
                      conditionResourceKind="baremetal_instance"
                    />
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>

            {/* Console tab */}
            <TabContent
              eventKey={3}
              id={BM_CONSOLE_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 3}
            >
              <TabContentBody style={{ paddingTop: '1rem' }}>
                <VmConsoleTab
                  vmId={instance.id}
                  vmName={resourceName}
                  resourceType={ConsoleResourceType.HOST}
                />
              </TabContentBody>
            </TabContent>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
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
  Spinner,
  Stack,
  StackItem,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import HddIcon from '@patternfly/react-icons/dist/esm/icons/hdd-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { VmConsoleTab } from './VmConsoleTab';
import { VmDetailsActionButtons } from './VmDetailsActionButtons';
import { VmDetailsCatalogValue } from './VmDetailsCatalogValue';
import { VmDetailsSummary } from './VmDetailsSummary';
import { useBlockVolumes, useDetachBlockVolume } from '../../../api/v1/block-volumes';
import {
  STORAGE_CLASS_COLORS,
  STORAGE_CLASS_LABELS,
  asDiskWithMeta,
} from '../../../api/v1/compute-instance-disk';
import { usePublicIPAttachments } from '../../../api/v1/ip-management';
import { formatResourceIdsForReview, resourceDisplayName } from '../../../api/v1/networking';
import { useSecurityGroups, useSubnets, useVirtualNetworks } from '../../../api/v1/networking';
import { useStorageTiers } from '../../../api/v1/storage-tier';
import { useDeleteVolumeSnapshot, useVolumeSnapshots } from '../../../api/v1/volume-snapshot';
import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';
import { VmStatusLabel } from '../../../VmStatusLabel';
import { ResourceUsageCard } from '../../metering/ResourceUsageCard';
import { Timestamp } from '../../Primitives/Timestamp';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';
import { DeleteConfirmModal } from '../../shared/DeleteConfirmModal';
import { SubtleContent } from '../../SubtleContent/SubtleContent';
import { CreateVolumeSnapshotModal } from '../storage/CreateVolumeSnapshotModal';

interface Props {
  vm: ComputeInstance;
}

const virtualNetworkLabel = (
  t: (key: string, options?: Record<string, unknown>) => string,
  index: number,
  total: number,
): string => {
  if (total === 1) {
    return t('Virtual network');
  }
  return t('Virtual network {{number}}', { number: index + 1 });
};

const VM_DETAIL_OVERVIEW_TAB_ID = 'vm-detail-overview';
const VM_DETAIL_NETWORKING_TAB_ID = 'vm-detail-networking';
const VM_DETAIL_STORAGE_TAB_ID = 'vm-detail-storage';
const VM_DETAIL_CONSOLE_TAB_ID = 'vm-detail-console';
const VM_DETAIL_USAGE_TAB_ID = 'vm-detail-usage';

export const VmDetails = ({ vm }: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  const runStrategy = vm.spec?.runStrategy;
  const catalogItem = vm.spec?.catalogItem;
  const tenant = vm.metadata?.tenant;
  const creator = vm.metadata?.creator;
  const instanceType = vm.spec?.instanceType;
  const imageRef = vm.spec?.image?.sourceRef;
  const bootDiskGib = vm.spec?.bootDisk?.sizeGib;
  const additionalDisks = vm.spec?.additionalDisks ?? [];
  const isWindows = vm.spec?.isWindows;
  const networkAttachments = vm.spec?.networkAttachments ?? [];
  const conditions = vm.status?.conditions ?? [];
  const sshKey = vm.spec?.sshKey;
  const userData = vm.spec?.userData;
  const lastRestartedAt = vm.status?.lastRestartedAt;
  const restartRequestedAt = vm.spec?.restartRequestedAt;

  const hasNetworkAttachments = networkAttachments.length > 0;

  const { data: subnets = [], isLoading: subnetsLoading } = useSubnets(
    {},
    { enabled: hasNetworkAttachments },
  );
  const { data: virtualNetworks = [], isLoading: vnLoading } = useVirtualNetworks(
    {},
    { enabled: hasNetworkAttachments },
  );
  const { data: securityGroups = [], isLoading: sgLoading } = useSecurityGroups(
    {},
    { enabled: hasNetworkAttachments },
  );
  const networkLoading = subnetsLoading || vnLoading || sgLoading;

  const instanceId = vm.id ?? '';
  const { data: snapshots = [], isLoading: snapshotsLoading } = useVolumeSnapshots(instanceId);
  const { mutate: deleteSnapshot } = useDeleteVolumeSnapshot(instanceId);
  const { data: allPublicIPAttachments = [] } = usePublicIPAttachments();
  const publicIPAttachments = allPublicIPAttachments.filter(
    (a) => a.spec?.target?.case === 'computeInstance' && a.spec.target.value === instanceId,
  );
  const assignedPublicIP = publicIPAttachments[0]?.status?.publicIpAddress;

  const { data: allBlockVolumes = [] } = useBlockVolumes();
  const attachedBlockVolumes = allBlockVolumes.filter((v) => v.status?.attachedTo === instanceId);
  const detachVolume = useDetachBlockVolume();

  const { data: storageTiers = [] } = useStorageTiers();
  const tierByClassName = Object.fromEntries(storageTiers.map((t) => [t.spec.storageClassName, t]));

  const resolveStorageClass = (storageClass: string | undefined) => {
    if (!storageClass) {
      return null;
    }
    const tier = tierByClassName[storageClass];
    return tier
      ? (tier.spec.displayName ?? tier.metadata?.name ?? storageClass)
      : (STORAGE_CLASS_LABELS[storageClass] ?? storageClass);
  };

  const blockVolumesGib = attachedBlockVolumes.reduce((sum, v) => sum + (v.spec?.sizeGib ?? 0), 0);

  const totalStorageGib =
    (bootDiskGib ?? 0) + additionalDisks.reduce((sum, d) => sum + (d.sizeGib ?? 0), 0);

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
                  parentTo="/vms"
                  parentLabel={t('Virtual machines')}
                  resourceName={vm.metadata?.name ?? vm.id}
                  titleAddon={<VmStatusLabel state={vm.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <VmDetailsActionButtons vm={vm} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <VmDetailsSummary vm={vm} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Tabs
              id="vm-detail-tabs"
              activeKey={activeTab}
              onSelect={(_e, key) => setActiveTab(Number(key))}
            >
              <Tab
                eventKey={0}
                title={<TabTitleText>{t('Overview')}</TabTitleText>}
                tabContentId={VM_DETAIL_OVERVIEW_TAB_ID}
              />
              <Tab
                eventKey={1}
                title={<TabTitleText>{t('Networking')}</TabTitleText>}
                tabContentId={VM_DETAIL_NETWORKING_TAB_ID}
              />
              <Tab
                eventKey={2}
                title={
                  <TabTitleText>
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      spaceItems={{ default: 'spaceItemsSm' }}
                    >
                      <FlexItem>{t('Storage')}</FlexItem>
                      {totalStorageGib + blockVolumesGib > 0 && (
                        <FlexItem>
                          <Badge isRead>{totalStorageGib + blockVolumesGib} GiB</Badge>
                        </FlexItem>
                      )}
                    </Flex>
                  </TabTitleText>
                }
                tabContentId={VM_DETAIL_STORAGE_TAB_ID}
              />
              <Tab
                eventKey={3}
                title={<TabTitleText>{t('Console')}</TabTitleText>}
                tabContentId={VM_DETAIL_CONSOLE_TAB_ID}
              />
              <Tab
                eventKey={4}
                title={<TabTitleText>{t('Usage')}</TabTitleText>}
                tabContentId={VM_DETAIL_USAGE_TAB_ID}
              />
            </Tabs>
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem span={12}>
            {/* ── Overview ── */}
            <TabContent
              eventKey={0}
              id={VM_DETAIL_OVERVIEW_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 0}
            >
              <TabContentBody>
                <Stack hasGutter>
                  <Card isFullHeight>
                    <CardTitle>{t('Overview')}</CardTitle>
                    <CardBody>
                      <DescriptionList isCompact columnModifier={{ default: '2Col', lg: '3Col' }}>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(vm.metadata?.name)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Catalog')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <VmDetailsCatalogValue catalogItemId={catalogItem} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        {instanceType && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Instance type')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {displayValue(instanceType)}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {imageRef && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Image')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {displayValue(imageRef)}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {isWindows !== undefined && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('OS')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {isWindows ? t('Windows') : t('Linux')}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Run strategy')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(runStrategy)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('SSH key')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {sshKey ? (
                              <Label color="blue" isCompact>
                                {t('Configured')}
                              </Label>
                            ) : (
                              '—'
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('User data')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {userData?.trim() ? (
                              <Label color="blue" isCompact>
                                {t('Cloud-init provided')}
                              </Label>
                            ) : (
                              '—'
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Timestamp value={vm.metadata?.creationTimestamp} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Last restarted')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Timestamp value={lastRestartedAt} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        {restartRequestedAt && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Restart requested')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Timestamp value={restartRequestedAt} />
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(tenant)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Creator')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(creator)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Version')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {vm.metadata?.version != null ? String(vm.metadata.version) : '—'}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardTitle>{t('Conditions')}</CardTitle>
                    <CardBody>
                      <ResourceConditionsTable
                        ariaLabel={t('Virtual machine conditions')}
                        conditions={conditions}
                        conditionResourceKind="compute_instance"
                      />
                    </CardBody>
                  </Card>
                </Stack>
              </TabContentBody>
            </TabContent>

            {/* ── Networking ── */}
            <TabContent
              eventKey={1}
              id={VM_DETAIL_NETWORKING_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 1}
            >
              <TabContentBody>
                <Card isFullHeight>
                  <CardTitle>{t('Networking')}</CardTitle>
                  <CardBody>
                    {(assignedPublicIP || vm.status?.internalIpAddress) && (
                      <DescriptionList isHorizontal isCompact style={{ marginBottom: '1rem' }}>
                        {assignedPublicIP && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Public IP')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Label color="blue" isCompact>
                                {assignedPublicIP}
                              </Label>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {vm.status?.internalIpAddress && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Internal IP')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Label color="teal" isCompact>
                                {vm.status.internalIpAddress}
                              </Label>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    )}
                    {networkAttachments.length > 0 ? (
                      networkLoading ? (
                        <Skeleton screenreaderText={t('Loading network details')} />
                      ) : (
                        <Table
                          aria-label={t('Virtual machine network attachments')}
                          variant="compact"
                          borders
                        >
                          <Thead>
                            <Tr>
                              <Th>{t('Virtual network')}</Th>
                              <Th>{t('Subnet')}</Th>
                              <Th>{t('Security groups')}</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {networkAttachments.map((attachment, index) => {
                              const subnet = subnets.find((s) => s.id === attachment.subnet);
                              const virtualNetworkId = subnet?.spec?.virtualNetwork;
                              const virtualNetwork = virtualNetworks.find(
                                (vn) => vn.id === virtualNetworkId,
                              );
                              const vnName = virtualNetwork
                                ? resourceDisplayName(virtualNetwork.metadata, virtualNetwork.id)
                                : virtualNetworkLabel(t, index, networkAttachments.length);
                              const subnetName = resourceDisplayName(
                                subnet?.metadata,
                                attachment.subnet,
                              );
                              const sgNames = formatResourceIdsForReview(
                                attachment.securityGroups,
                                securityGroups,
                              );
                              return (
                                <Tr key={`network-attachment-${index}`}>
                                  <Td dataLabel={t('Virtual network')}>{vnName}</Td>
                                  <Td dataLabel={t('Subnet')}>{subnetName}</Td>
                                  <Td dataLabel={t('Security groups')}>{sgNames}</Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )
                    ) : (
                      <SubtleContent component="p">
                        {t('No virtual networks configured.')}
                      </SubtleContent>
                    )}
                  </CardBody>
                </Card>
              </TabContentBody>
            </TabContent>

            {/* ── Storage ── */}
            <TabContent
              eventKey={2}
              id={VM_DETAIL_STORAGE_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 2}
            >
              <TabContentBody>
                <Stack hasGutter>
                  {/* Storage summary */}
                  <StackItem>
                    <Card>
                      <CardTitle>{t('Storage summary')}</CardTitle>
                      <CardBody>
                        <DescriptionList
                          isHorizontal
                          isCompact
                          columnModifier={{ default: '2Col', lg: '4Col' }}
                        >
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Boot disk')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {bootDiskGib != null ? `${bootDiskGib} GiB` : '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Additional disks')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {additionalDisks.length > 0
                                ? `${additionalDisks.reduce((s, d) => s + (d.sizeGib ?? 0), 0)} GiB (${additionalDisks.length} disk${additionalDisks.length !== 1 ? 's' : ''})`
                                : '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Block volumes')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {attachedBlockVolumes.length > 0
                                ? `${blockVolumesGib} GiB (${attachedBlockVolumes.length} volume${attachedBlockVolumes.length !== 1 ? 's' : ''})`
                                : '—'}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Total allocated')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              <strong>{totalStorageGib + blockVolumesGib} GiB</strong>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </CardBody>
                    </Card>
                  </StackItem>

                  {/* Boot + Additional volumes row */}
                  <StackItem>
                    <Grid hasGutter>
                      {/* Boot volume — 1/3 width */}
                      <GridItem span={12} md={4}>
                        <Card isFullHeight>
                          <CardTitle>
                            <Flex
                              alignItems={{ default: 'alignItemsCenter' }}
                              spaceItems={{ default: 'spaceItemsSm' }}
                            >
                              <FlexItem>
                                <HddIcon aria-hidden />
                              </FlexItem>
                              <FlexItem>{t('Boot volume')}</FlexItem>
                            </Flex>
                          </CardTitle>
                          <CardBody>
                            {bootDiskGib != null ? (
                              <DescriptionList isCompact>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>{t('Size')}</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {bootDiskGib} GiB
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    <Label color="grey" isCompact>
                                      {t('Root')}
                                    </Label>
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                {(() => {
                                  const d = asDiskWithMeta(vm.spec?.bootDisk);
                                  const label = resolveStorageClass(d.storageClass);
                                  return label ? (
                                    <DescriptionListGroup>
                                      <DescriptionListTerm>{t('Storage tier')}</DescriptionListTerm>
                                      <DescriptionListDescription>
                                        <Label
                                          color={
                                            STORAGE_CLASS_COLORS[d.storageClass ?? ''] ?? 'grey'
                                          }
                                          isCompact
                                        >
                                          {label}
                                        </Label>
                                      </DescriptionListDescription>
                                    </DescriptionListGroup>
                                  ) : null;
                                })()}
                              </DescriptionList>
                            ) : (
                              <Content component="p">{t('No boot disk configured.')}</Content>
                            )}
                          </CardBody>
                        </Card>
                      </GridItem>

                      {/* Additional volumes — 2/3 width */}
                      <GridItem span={12} md={8}>
                        <Card isFullHeight>
                          <CardTitle>
                            <Flex
                              alignItems={{ default: 'alignItemsCenter' }}
                              spaceItems={{ default: 'spaceItemsSm' }}
                            >
                              <FlexItem>
                                <HddIcon aria-hidden />
                              </FlexItem>
                              <FlexItem>{t('Additional volumes')}</FlexItem>
                              {additionalDisks.length > 0 && (
                                <FlexItem>
                                  <Badge isRead>{additionalDisks.length}</Badge>
                                </FlexItem>
                              )}
                            </Flex>
                          </CardTitle>
                          <CardBody>
                            {additionalDisks.length > 0 ? (
                              <Table aria-label={t('Additional volumes')} variant="compact">
                                <Thead>
                                  <Tr>
                                    <Th>#</Th>
                                    <Th>{t('Size')}</Th>
                                    <Th>{t('Storage tier')}</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {additionalDisks.map((disk, idx) => {
                                    const d = asDiskWithMeta(disk);
                                    const label = resolveStorageClass(d.storageClass);
                                    return (
                                      <Tr key={idx}>
                                        <Td dataLabel="#">{idx + 1}</Td>
                                        <Td dataLabel={t('Size')}>{disk.sizeGib} GiB</Td>
                                        <Td dataLabel={t('Storage tier')}>
                                          {label ? (
                                            <Label
                                              color={
                                                STORAGE_CLASS_COLORS[d.storageClass ?? ''] ?? 'grey'
                                              }
                                              isCompact
                                            >
                                              {label}
                                            </Label>
                                          ) : (
                                            '—'
                                          )}
                                        </Td>
                                      </Tr>
                                    );
                                  })}
                                </Tbody>
                              </Table>
                            ) : (
                              <SubtleContent component="p">
                                {t('No additional volumes attached.')}
                              </SubtleContent>
                            )}
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </StackItem>

                  {/* Attached block volumes */}
                  <StackItem>
                    <Card>
                      <CardTitle>
                        <Flex
                          alignItems={{ default: 'alignItemsCenter' }}
                          spaceItems={{ default: 'spaceItemsSm' }}
                        >
                          <FlexItem>{t('Block volumes')}</FlexItem>
                          {attachedBlockVolumes.length > 0 && (
                            <FlexItem>
                              <Badge isRead>{attachedBlockVolumes.length}</Badge>
                            </FlexItem>
                          )}
                        </Flex>
                      </CardTitle>
                      <CardBody>
                        {attachedBlockVolumes.length > 0 ? (
                          <Table aria-label={t('Attached block volumes')} variant="compact">
                            <Thead>
                              <Tr>
                                <Th>{t('Name')}</Th>
                                <Th>{t('Size')}</Th>
                                <Th>{t('Storage tier')}</Th>
                                <Th>{t('State')}</Th>
                                <Th aria-label={t('Actions')} />
                              </Tr>
                            </Thead>
                            <Tbody>
                              {attachedBlockVolumes.map((vol) => {
                                const label = resolveStorageClass(vol.spec?.storageClass);
                                const stateColor =
                                  vol.status?.state === 'ATTACHED'
                                    ? 'green'
                                    : vol.status?.state === 'FAILED'
                                      ? 'red'
                                      : vol.status?.state === 'DETACHING'
                                        ? 'orange'
                                        : 'blue';
                                return (
                                  <Tr key={vol.id}>
                                    <Td dataLabel={t('Name')}>
                                      <strong>{vol.metadata?.name ?? vol.id}</strong>
                                    </Td>
                                    <Td dataLabel={t('Size')}>{vol.spec?.sizeGib} GiB</Td>
                                    <Td dataLabel={t('Storage tier')}>
                                      {label ? (
                                        <Label
                                          color={
                                            STORAGE_CLASS_COLORS[vol.spec?.storageClass ?? ''] ??
                                            'grey'
                                          }
                                          isCompact
                                        >
                                          {label}
                                        </Label>
                                      ) : (
                                        '—'
                                      )}
                                    </Td>
                                    <Td dataLabel={t('State')}>
                                      <Label color={stateColor} isCompact>
                                        {vol.status?.state}
                                      </Label>
                                    </Td>
                                    <Td isActionCell>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        isLoading={detachVolume.isPending}
                                        isDisabled={detachVolume.isPending}
                                        onClick={() => detachVolume.mutate(vol.id)}
                                      >
                                        {t('Detach')}
                                      </Button>
                                    </Td>
                                  </Tr>
                                );
                              })}
                            </Tbody>
                          </Table>
                        ) : (
                          <SubtleContent component="p">
                            {t('No block volumes attached.')}
                          </SubtleContent>
                        )}
                      </CardBody>
                    </Card>
                  </StackItem>

                  {/* Snapshots */}
                  <StackItem>
                    <Card>
                      <CardTitle>
                        <Flex
                          alignItems={{ default: 'alignItemsCenter' }}
                          justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        >
                          <Flex
                            alignItems={{ default: 'alignItemsCenter' }}
                            spaceItems={{ default: 'spaceItemsSm' }}
                          >
                            <FlexItem>{t('Snapshots')}</FlexItem>
                            {snapshots.length > 0 && (
                              <FlexItem>
                                <Badge isRead>{snapshots.length}</Badge>
                              </FlexItem>
                            )}
                          </Flex>
                          <FlexItem>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSnapshotModalOpen(true)}
                            >
                              {t('Take snapshot')}
                            </Button>
                          </FlexItem>
                        </Flex>
                      </CardTitle>
                      <CardBody>
                        {snapshotsLoading ? (
                          <Spinner size="md" aria-label={t('Loading snapshots')} />
                        ) : snapshots.length > 0 ? (
                          <Table aria-label={t('Snapshots')} variant="compact">
                            <Thead>
                              <Tr>
                                <Th>{t('Name')}</Th>
                                <Th>{t('Disk')}</Th>
                                <Th>{t('Size')}</Th>
                                <Th>{t('Status')}</Th>
                                <Th>{t('Created')}</Th>
                                <Th aria-label={t('Actions')} />
                              </Tr>
                            </Thead>
                            <Tbody>
                              {snapshots.map((snap) => (
                                <Tr key={snap.id}>
                                  <Td dataLabel={t('Name')}>{snap.metadata?.name ?? snap.id}</Td>
                                  <Td dataLabel={t('Disk')}>
                                    {snap.spec.diskIndex === 0
                                      ? t('Boot')
                                      : t('Disk {{index}}', { index: snap.spec.diskIndex })}
                                  </Td>
                                  <Td dataLabel={t('Size')}>
                                    {snap.status.sizeGib != null
                                      ? `${snap.status.sizeGib} GiB`
                                      : '—'}
                                  </Td>
                                  <Td dataLabel={t('Status')}>
                                    <Label
                                      color={
                                        snap.status.state === 'READY'
                                          ? 'green'
                                          : snap.status.state === 'FAILED'
                                            ? 'red'
                                            : snap.status.state === 'DELETING'
                                              ? 'orange'
                                              : 'blue'
                                      }
                                      isCompact
                                    >
                                      {snap.status.state}
                                    </Label>
                                  </Td>
                                  <Td dataLabel={t('Created')}>
                                    {snap.metadata?.creationTimestamp
                                      ? new Date(
                                          snap.metadata.creationTimestamp,
                                        ).toLocaleDateString()
                                      : '—'}
                                  </Td>
                                  <Td dataLabel={t('Actions')} modifier="fitContent">
                                    <Button
                                      variant="plain"
                                      aria-label={t('Delete snapshot')}
                                      isDanger
                                      onClick={() =>
                                        setSnapshotToDelete({
                                          id: snap.id,
                                          name: snap.metadata?.name ?? snap.id,
                                        })
                                      }
                                    >
                                      ✕
                                    </Button>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        ) : (
                          <SubtleContent component="p">{t('No snapshots yet.')}</SubtleContent>
                        )}
                      </CardBody>
                    </Card>
                  </StackItem>
                </Stack>
              </TabContentBody>
            </TabContent>

            {/* ── Console ── */}
            <TabContent
              eventKey={3}
              id={VM_DETAIL_CONSOLE_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 3}
            >
              <TabContentBody style={{ paddingTop: '1rem' }}>
                <VmConsoleTab vmId={instanceId} vmName={vm.metadata?.name ?? instanceId} />
              </TabContentBody>
            </TabContent>

            {/* ── Usage ── */}
            <TabContent
              eventKey={4}
              id={VM_DETAIL_USAGE_TAB_ID}
              activeKey={activeTab}
              hidden={activeTab !== 4}
            >
              <TabContentBody>
                <ResourceUsageCard
                  resourceId={instanceId}
                  tenantId={tenant}
                  title={t('VM usage')}
                />
              </TabContentBody>
            </TabContent>
          </GridItem>
        </Grid>
      </PageSection>
      <CreateVolumeSnapshotModal
        vm={vm}
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
      />
      {snapshotToDelete && (
        <DeleteConfirmModal
          resourceName={snapshotToDelete.name}
          resourceKind="snapshot"
          onConfirm={async () => {
            deleteSnapshot(snapshotToDelete.id);
            setSnapshotToDelete(null);
          }}
          onClose={() => setSnapshotToDelete(null)}
        />
      )}
    </>
  );
};

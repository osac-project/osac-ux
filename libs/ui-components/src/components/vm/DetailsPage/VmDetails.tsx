import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import PencilAltIcon from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';

import { type ComputeInstance, GuestOSFamily } from '@osac/types';

import VmDetailsActionButtons from './VmDetailsActionButtons';
import VmExternalIpSection from './VmExternalIpSection';
import VmNetworkingTab from './VmNetworkingTab';
import VmResizeModal from './VmResizeModal';
import VmStorageCard from './VmStorageCard';
import VmUtilizationSection from './VmUtilizationSection';
import { useDiskImage } from '../../../api/v1/disk-image';
import { useInstanceType } from '../../../api/v1/instance-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';
import { getErrorMessage } from '../../../utils/error';
import { VmStatusLabel } from '../../../VmStatusLabel';
import { guestOsFamilyLabels } from '../../DiskImage/DiskImageTable';
import { Timestamp } from '../../Primitives/Timestamp';
import { ResourceDetailHeader } from '../../Resource/ResourceDetailHeader';

import './VmDetails.css';
import '../../shared/details-page.css';

interface Props {
  vm: ComputeInstance;
}

const VmDetails = ({ vm }: Props) => {
  const { t } = useTranslation();
  const [resizeOpen, setResizeOpen] = useState(false);
  const { data: instanceType, error: instanceTypeError } = useInstanceType(
    vm.spec?.instanceType?.id,
  );
  const { data: diskImage } = useDiskImage(vm.spec?.diskImage?.id);
  const guestOsFamilyText = guestOsFamilyLabels(t);
  const catalogItem = vm.spec?.catalogItem;

  return (
    <>
      <PageSection hasBodyWrapper={false} className="vm-details__header-section">
        <Stack hasGutter>
          {instanceTypeError ? (
            <StackItem>
              <Alert variant="danger" title={t('Could not load instance types')} isInline>
                {getErrorMessage(instanceTypeError)}
              </Alert>
            </StackItem>
          ) : null}
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
                  description={t(
                    'Review configuration, networking, and access for this virtual machine.',
                  )}
                  titleAddon={<VmStatusLabel state={vm.status?.state} />}
                  titleSize="3xl"
                />
              </FlexItem>
              <FlexItem className="vm-details__header-actions">
                <VmDetailsActionButtons vm={vm} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider className="vm-details__section-divider" />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter className="details-page__content-grid">
          <GridItem md={8} className="details-page__column">
            <Stack hasGutter>
              <StackItem>
                <Grid hasGutter className="vm-details__overview-grid">
                  <GridItem md={4}>
                    <Title headingLevel="h2" size="md" className="vm-details__section-title">
                      {t('Overview')}
                    </Title>
                    <DescriptionList
                      isCompact
                      className="details-page__overview"
                      aria-label={t('Virtual machine overview')}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Project')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.metadata?.project ? (
                            <Link to={`/projects/${encodeURIComponent(vm.metadata.project)}`}>
                              {vm.metadata.project}
                            </Link>
                          ) : (
                            displayValue(undefined)
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
                        <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {catalogItem?.id ? (
                            <Link
                              className="vm-details__catalog-link"
                              to={`/vms/create/${encodeURIComponent(catalogItem.id)}`}
                            >
                              {displayValue(catalogItem.name || catalogItem.id)}
                            </Link>
                          ) : (
                            displayValue(undefined)
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>

                  <GridItem md={4}>
                    <Title headingLevel="h2" size="md" className="vm-details__section-title">
                      {t('Configuration')}
                    </Title>
                    <DescriptionList
                      isCompact
                      className="details-page__overview"
                      aria-label={t('Virtual machine configuration')}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Guest OS family')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {diskImage?.spec?.guestOsFamily !== undefined
                            ? guestOsFamilyText[
                                diskImage.spec.guestOsFamily ??
                                  GuestOSFamily.GUEST_OS_FAMILY_UNSPECIFIED
                              ]
                            : displayValue(undefined)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          <Flex
                            spaceItems={{ default: 'spaceItemsSm' }}
                            alignItems={{ default: 'alignItemsCenter' }}
                          >
                            <FlexItem className="vm-details__instance-type-title">
                              {t('Instance type')}
                            </FlexItem>
                            <FlexItem>
                              <Button
                                variant="plain"
                                aria-label={t('Resize virtual machine')}
                                onClick={() => setResizeOpen(true)}
                                icon={<PencilAltIcon />}
                              />
                            </FlexItem>
                          </Flex>
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <DescriptionList isCompact aria-label={t('Instance type details')}>
                            <DescriptionListGroup>
                              <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                              <DescriptionListDescription>
                                {displayValue(
                                  instanceType?.metadata?.name || vm.spec?.instanceType?.id,
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>{t('vCPUs')}</DescriptionListTerm>
                              <DescriptionListDescription>
                                {instanceType?.spec?.vcpus ?? '—'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>{t('Memory')}</DescriptionListTerm>
                              <DescriptionListDescription>
                                {instanceType?.spec?.memoryGib !== undefined
                                  ? `${instanceType.spec.memoryGib} GiB`
                                  : '—'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>

                  <GridItem md={4}>
                    <Title headingLevel="h2" size="md" className="vm-details__section-title">
                      {t('Access & initial run')}
                    </Title>
                    <DescriptionList
                      isCompact
                      className="details-page__overview"
                      aria-label={t('Virtual machine access and initial run')}
                    >
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec?.sshKey?.id ? (
                            <Link
                              className="vm-details__resource-link"
                              to={`/secrets/${encodeURIComponent(vm.spec.sshKey.id)}`}
                            >
                              {displayValue(vm.spec.sshKey.name || vm.spec.sshKey.id)}
                            </Link>
                          ) : (
                            displayValue(vm.spec?.sshKey?.name)
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('User data')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {vm.spec?.userData?.trim() ? t('Configured') : t('Not configured')}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </GridItem>
                </Grid>
              </StackItem>

              <StackItem>
                <Divider className="vm-details__section-divider" />
              </StackItem>

              <StackItem>
                <VmUtilizationSection vm={vm} />
              </StackItem>

              <StackItem>
                <Divider className="vm-details__section-divider" />
              </StackItem>

              <StackItem>
                <VmExternalIpSection vm={vm} />
              </StackItem>

              <StackItem>
                <Divider className="vm-details__section-divider" />
              </StackItem>

              <StackItem>
                <VmNetworkingTab vm={vm} />
              </StackItem>

              <StackItem>
                <VmStorageCard vm={vm} />
              </StackItem>
            </Stack>
          </GridItem>

          <GridItem md={4} className="details-page__column">
            <Stack hasGutter>
              <StackItem>
                <Card variant="secondary" className="details-page__rail-card">
                  <CardTitle>{t('Alerts')}</CardTitle>
                  <Divider />
                  <CardBody>{t('No alerts')}</CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card variant="secondary" className="details-page__rail-card">
                  <CardTitle>{t('Recent activity')}</CardTitle>
                  <Divider />
                  <CardBody>{t('No recent activity')}</CardBody>
                </Card>
              </StackItem>
            </Stack>
          </GridItem>
        </Grid>
      </PageSection>

      {resizeOpen ? <VmResizeModal vm={vm} onClose={() => setResizeOpen(false)} /> : null}
    </>
  );
};

export default VmDetails;

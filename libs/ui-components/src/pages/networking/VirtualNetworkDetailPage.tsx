import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
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
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { type NATGateway, type VirtualNetwork, VirtualNetworkState } from '@osac/types';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';

import {
  useNatGateway,
  useSecurityGroups,
  useSubnets,
  useVirtualNetwork,
  virtualNetworkScopeFilter,
} from '../../api/v1/networking';
import { DetachNatGatewayModal } from '../../components/networking/DetachNatGatewayModal';
import NatGatewayCard from '../../components/networking/NatGatewayCard';
import { SecurityGroupCreateModal } from '../../components/networking/SecurityGroupCreateModal';
import { SecurityGroupStatusLabel } from '../../components/networking/SecurityGroupStatusLabel';
import { SubnetCreateModal } from '../../components/networking/SubnetCreateModal';
import { SubnetStatusLabel } from '../../components/networking/SubnetStatusLabel';
import VirtualNetworkDetailsActionsMenu from '../../components/networking/VirtualNetworkDetailsActionsMenu';
import { VirtualNetworkStatusLabel } from '../../components/networking/VirtualNetworkStatusLabel';
import { Timestamp } from '../../components/Primitives/Timestamp';
import { ResourceDetailHeader } from '../../components/Resource/ResourceDetailHeader';
import ResourceDetailsPage from '../../components/Resource/ResourceDetailsPage';
import { SubtleContent } from '../../components/SubtleContent/SubtleContent';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { getErrorMessage } from '../../utils/error';

import './VirtualNetworkDetailPage.css';
import '../../components/shared/details-page.css';

const VIRTUAL_NETWORKS_LIST_PATH = '/networking/virtual-networks';

interface VirtualNetworkDetailContentProps {
  vn: VirtualNetwork;
  id: string;
}

const VirtualNetworkDetailContent = ({ vn, id }: VirtualNetworkDetailContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubnetModalOpen, setIsSubnetModalOpen] = useState(false);
  const [isSecurityGroupModalOpen, setIsSecurityGroupModalOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState<NATGateway>();

  const {
    data: subnets = [],
    isLoading: isLoadingSubnets,
    error: subnetsError,
  } = useSubnets({
    filter: virtualNetworkScopeFilter(id),
  });
  const {
    data: securityGroups = [],
    isLoading: isLoadingSecurityGroups,
    error: securityGroupsError,
  } = useSecurityGroups({
    filter: virtualNetworkScopeFilter(id),
  });
  const {
    natGateway,
    natAddress,
    isLoading: isLoadingNatGateway,
    error: natGatewayError,
  } = useNatGateway(id);

  const isFailed = vn.status?.state === VirtualNetworkState.FAILED;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          {isFailed && vn.status?.message ? (
            <StackItem>
              <Alert variant="danger" title={t('Provisioning failed')} isInline>
                {vn.status.message}
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
                  parentTo={VIRTUAL_NETWORKS_LIST_PATH}
                  parentLabel={t('Virtual networks')}
                  resourceName={vn.metadata?.name ?? vn.id}
                  titleSize="3xl"
                  description={t('View the virtual network configuration and related resources.')}
                  titleAddon={<VirtualNetworkStatusLabel state={vn.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <VirtualNetworkDetailsActionsMenu virtualNetwork={vn} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem md={8}>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size="lg">
                  {t('Overview')}
                </Title>
              </StackItem>
              <StackItem>
                <DescriptionList
                  isCompact
                  className="details-page__overview"
                  aria-label={t('Virtual network overview')}
                >
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('IPv4 CIDR')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {displayValue(vn.spec?.ipv4Cidr)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <VirtualNetworkStatusLabel state={vn.status?.state} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {vn.status?.message && !isFailed ? (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {displayValue(vn.status.message)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ) : null}
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Timestamp value={vn.metadata?.creationTimestamp} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Creator')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {displayValue(vn.metadata?.creator)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </StackItem>

              <StackItem>
                <Divider />
              </StackItem>

              <StackItem>
                <Flex
                  alignItems={{ default: 'alignItemsBaseline' }}
                  justifyContent={{ default: 'justifyContentSpaceBetween' }}
                  flexWrap={{ default: 'wrap' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                >
                  <FlexItem>
                    <Title headingLevel="h2" size="lg">
                      {t('Subnets')}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<PlusCircleIcon />}
                      onClick={() => setIsSubnetModalOpen(true)}
                    >
                      {t('Create subnet')}
                    </Button>
                  </FlexItem>
                </Flex>
              </StackItem>
              <StackItem>
                {isLoadingSubnets ? (
                  <SubtleContent component="p">{t('Loading subnets...')}</SubtleContent>
                ) : subnetsError ? (
                  <Alert variant="danger" title={t('Failed to load subnets')} isInline>
                    {getErrorMessage(subnetsError)}
                  </Alert>
                ) : subnets.length === 0 ? (
                  <SubtleContent component="p">
                    {t('No subnets yet. Create one to get started.')}
                  </SubtleContent>
                ) : (
                  <Table aria-label={t('Subnets')} variant="compact" borders>
                    <Thead>
                      <Tr>
                        <Th>{t('Name')}</Th>
                        <Th>{t('Status')}</Th>
                        <Th>{t('CIDR')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subnets.map((subnet) => (
                        <Tr key={subnet.id}>
                          <Td dataLabel={t('Name')}>
                            <ResourceNameField resource={subnet} />
                          </Td>
                          <Td dataLabel={t('Status')}>
                            <SubnetStatusLabel state={subnet.status?.state} />
                          </Td>
                          <Td dataLabel={t('CIDR')}>{displayValue(subnet.spec?.ipv4Cidr)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </StackItem>

              <StackItem>
                <Flex
                  alignItems={{ default: 'alignItemsBaseline' }}
                  justifyContent={{ default: 'justifyContentSpaceBetween' }}
                  flexWrap={{ default: 'wrap' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                >
                  <FlexItem>
                    <Title headingLevel="h2" size="lg">
                      {t('Security groups')}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<PlusCircleIcon />}
                      onClick={() => setIsSecurityGroupModalOpen(true)}
                    >
                      {t('Create security group')}
                    </Button>
                  </FlexItem>
                </Flex>
              </StackItem>
              <StackItem>
                {isLoadingSecurityGroups ? (
                  <SubtleContent component="p">{t('Loading security groups...')}</SubtleContent>
                ) : securityGroupsError ? (
                  <Alert variant="danger" title={t('Failed to load security groups')} isInline>
                    {getErrorMessage(securityGroupsError)}
                  </Alert>
                ) : securityGroups.length === 0 ? (
                  <SubtleContent component="p">
                    {t('No security groups yet. Create one to get started.')}
                  </SubtleContent>
                ) : (
                  <Table aria-label={t('Security groups')} variant="compact" borders>
                    <Thead>
                      <Tr>
                        <Th>{t('Name')}</Th>
                        <Th>{t('Status')}</Th>
                        <Th>{t('Inbound Rules')}</Th>
                        <Th>{t('Outbound Rules')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {securityGroups.map((sg) => {
                        const ingressCount = sg.spec?.ingress?.length ?? 0;
                        const egressCount = sg.spec?.egress?.length ?? 0;

                        return (
                          <Tr key={sg.id}>
                            <Td dataLabel={t('Name')}>
                              <ResourceNameField
                                resource={sg}
                                detailsUrl={`/networking/security-groups/${sg.id}`}
                                nameLinkClassName="virtual-network-details-security-group-link"
                              />
                            </Td>
                            <Td dataLabel={t('Status')}>
                              <SecurityGroupStatusLabel state={sg.status?.state} />
                            </Td>
                            <Td dataLabel={t('Inbound Rules')}>{ingressCount}</Td>
                            <Td dataLabel={t('Outbound Rules')}>{egressCount}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </StackItem>
            </Stack>
          </GridItem>

          <GridItem md={4}>
            <Stack hasGutter>
              <StackItem>
                <NatGatewayCard
                  natAddress={natAddress}
                  natGateway={natGateway}
                  isLoading={isLoadingNatGateway}
                  error={natGatewayError}
                  onAttach={() => navigate(`/networking/virtual-networks/${id}/nat-gateway/attach`)}
                  onDetach={setDetachTarget}
                />
              </StackItem>
            </Stack>
          </GridItem>
        </Grid>
      </PageSection>

      {isSecurityGroupModalOpen && (
        <SecurityGroupCreateModal
          onClose={() => setIsSecurityGroupModalOpen(false)}
          virtualNetworkId={id}
        />
      )}

      {isSubnetModalOpen && (
        <SubnetCreateModal
          onClose={() => setIsSubnetModalOpen(false)}
          parentVN={vn}
          existingSubnets={subnets}
        />
      )}
      {detachTarget && (
        <DetachNatGatewayModal
          natGateway={detachTarget}
          onClose={() => setDetachTarget(undefined)}
        />
      )}
    </>
  );
};

export const VirtualNetworkDetailPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data: vn, isLoading, error, refetch } = useVirtualNetwork(id);

  return (
    <ResourceDetailsPage
      error={error}
      found={!!vn}
      isLoading={isLoading}
      parentLabel={t('Virtual networks')}
      parentTo={VIRTUAL_NETWORKS_LIST_PATH}
      refetch={refetch}
      resourceLabel={t('virtual network')}
      cardCount={2}
    >
      {vn ? <VirtualNetworkDetailContent vn={vn} id={id} /> : null}
    </ResourceDetailsPage>
  );
};

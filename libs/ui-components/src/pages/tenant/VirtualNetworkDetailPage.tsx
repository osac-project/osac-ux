/**
 * flow: manage-networking
 * step: vnet_detail
 * route: /networks/:id
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import {
  resourceDisplayName,
  useDeleteVirtualNetwork,
  useVirtualNetwork,
} from '../../api/v1/networking';
import { NetworkStatusLabel } from '../../components/Network/NetworkStatusLabel';
import { SecurityGroupsList } from '../../components/Network/SecurityGroupsList';
import { SubnetsList } from '../../components/Network/SubnetsList';
import { ResourceDetailHeader } from '../../components/Resource/ResourceDetailHeader';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';

export const VirtualNetworkDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vnet } = useVirtualNetwork(id);
  const deleteVNet = useDeleteVirtualNetwork();

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const vnetName = vnet ? resourceDisplayName(vnet.metadata, vnet.id) : id;

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
                  parentTo="/networks"
                  parentLabel="Networks"
                  resourceName={vnetName}
                  titleAddon={vnet ? <NetworkStatusLabel state={vnet.status?.state} /> : undefined}
                />
              </FlexItem>
              <FlexItem>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  Delete
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.75rem' }}>
          Subnets
        </Title>
        <SubnetsList virtualNetworkId={id} />
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.75rem' }}>
          Security Groups
        </Title>
        <SecurityGroupsList virtualNetworkId={id} />
      </PageSection>

      {deleteOpen && (
        <DeleteConfirmModal
          resourceName={vnetName}
          resourceKind="virtual network"
          error={deleteVNet.error}
          onConfirm={async () => {
            await deleteVNet.mutateAsync(id);
            navigate('/networks');
          }}
          onClose={() => {
            deleteVNet.reset();
            setDeleteOpen(false);
          }}
        />
      )}
    </>
  );
};

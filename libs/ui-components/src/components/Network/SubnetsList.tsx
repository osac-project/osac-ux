import React from 'react';
import { Link } from 'react-router-dom';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Subnet } from '@osac/types';

import { NetworkStatusLabel } from './NetworkStatusLabel';
import {
  resourceDisplayName,
  useDeleteSubnet,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../api/v1/networking';
import ListPageBody from '../Page/ListPageBody';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { SubtleContent } from '../SubtleContent/SubtleContent';

interface SubnetsListProps {
  virtualNetworkId?: string;
}

export const SubnetsList = ({ virtualNetworkId }: SubnetsListProps) => {
  const params = virtualNetworkId
    ? { filter: virtualNetworkFilterForSubnetList(virtualNetworkId) }
    : {};

  const { data: subnets = [], isLoading, error } = useSubnets(params);
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !virtualNetworkId });
  const deleteSubnet = useDeleteSubnet();
  const [deleteTarget, setDeleteTarget] = React.useState<Subnet | null>(null);

  const vnetName = (vnetId: string) => {
    const vn = virtualNetworks.find((v) => v.id === vnetId);
    return vn ? resourceDisplayName(vn.metadata, vn.id) : vnetId;
  };

  return (
    <>
      <ListPageBody isLoading={isLoading} error={error}>
        {subnets.length === 0 ? (
          <SubtleContent component="p">No subnets yet. Create one to get started.</SubtleContent>
        ) : (
          <Table aria-label="Subnets" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                {!virtualNetworkId && <Th>Virtual network</Th>}
                <Th>IPv4 CIDR</Th>
                <Th>IPv6 CIDR</Th>
                <Th>State</Th>
                <Th aria-label="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {subnets.map((subnet) => {
                const vnetId = subnet.spec?.virtualNetwork;
                return (
                  <Tr key={subnet.id}>
                    <Td dataLabel="Name">{resourceDisplayName(subnet.metadata, subnet.id)}</Td>
                    {!virtualNetworkId && (
                      <Td dataLabel="Virtual network">
                        {vnetId ? <Link to={`/networks/${vnetId}`}>{vnetName(vnetId)}</Link> : '—'}
                      </Td>
                    )}
                    <Td dataLabel="IPv4 CIDR">{subnet.spec?.ipv4Cidr || '—'}</Td>
                    <Td dataLabel="IPv6 CIDR">{subnet.spec?.ipv6Cidr || '—'}</Td>
                    <Td dataLabel="State">
                      <NetworkStatusLabel state={subnet.status?.state} />
                    </Td>
                    <Td dataLabel="Actions" isActionCell>
                      <ActionsColumn
                        items={[
                          ...(vnetId && !virtualNetworkId
                            ? [{ title: 'Manage in network', onClick: () => void 0 }]
                            : []),
                          {
                            title: 'Delete',
                            onClick: (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setDeleteTarget(subnet);
                            },
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {deleteTarget && (
        <DeleteConfirmModal
          resourceName={resourceDisplayName(deleteTarget.metadata, deleteTarget.id)}
          resourceKind="subnet"
          error={deleteSubnet.error}
          onConfirm={async () => {
            await deleteSubnet.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => {
            deleteSubnet.reset();
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
};

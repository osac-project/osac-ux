import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { VirtualNetwork } from '@osac/types';

import { NetworkStatusLabel } from './NetworkStatusLabel';
import { useDeleteVirtualNetwork, useVirtualNetworks } from '../../api/v1/networking';
import { resourceDisplayName } from '../../api/v1/networking';
import ListPageBody from '../Page/ListPageBody';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { SubtleContent } from '../SubtleContent/SubtleContent';

export const VirtualNetworksList = () => {
  const navigate = useNavigate();
  const { data: vnets = [], isLoading, error } = useVirtualNetworks();
  const deleteVNet = useDeleteVirtualNetwork();
  const [deleteTarget, setDeleteTarget] = React.useState<VirtualNetwork | null>(null);

  return (
    <>
      <ListPageBody isLoading={isLoading} error={error}>
        {vnets.length === 0 ? (
          <SubtleContent component="p">
            No virtual networks yet. Create one to get started.
          </SubtleContent>
        ) : (
          <Table aria-label="Virtual networks" variant="compact" borders>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Network class</Th>
                <Th>IPv4 CIDR</Th>
                <Th>State</Th>
                <Th aria-label="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {vnets.map((vnet) => (
                <Tr key={vnet.id}>
                  <Td dataLabel="Name">
                    <Button
                      variant="link"
                      isInline
                      onClick={() => navigate(`/networks/${vnet.id}`)}
                    >
                      {resourceDisplayName(vnet.metadata, vnet.id)}
                    </Button>
                  </Td>
                  <Td dataLabel="Network class">{vnet.spec?.networkClass || '—'}</Td>
                  <Td dataLabel="IPv4 CIDR">{vnet.spec?.ipv4Cidr || '—'}</Td>
                  <Td dataLabel="State">
                    <NetworkStatusLabel state={vnet.status?.state} />
                  </Td>
                  <Td dataLabel="Actions" isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: 'Delete',
                          onClick: () => setDeleteTarget(vnet),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {deleteTarget && (
        <DeleteConfirmModal
          resourceName={resourceDisplayName(deleteTarget.metadata, deleteTarget.id)}
          resourceKind="virtual network"
          error={deleteVNet.error}
          onConfirm={async () => {
            await deleteVNet.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => {
            deleteVNet.reset();
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
};

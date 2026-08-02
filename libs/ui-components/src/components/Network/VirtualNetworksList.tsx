import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { VirtualNetwork } from '@osac/types';

import { NetworkStatusLabel } from './NetworkStatusLabel';
import { useDeleteVirtualNetwork, useVirtualNetworks } from '../../api/v1/networking';
import { resourceDisplayName } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import ListPageBody from '../Page/ListPageBody';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { SubtleContent } from '../SubtleContent/SubtleContent';

export const VirtualNetworksList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: vnets = [], isLoading, error } = useVirtualNetworks();
  const deleteVNet = useDeleteVirtualNetwork();
  const [deleteTarget, setDeleteTarget] = React.useState<VirtualNetwork | null>(null);

  return (
    <>
      <ListPageBody isLoading={isLoading} error={error}>
        {vnets.length === 0 ? (
          <SubtleContent component="p">
            {t('No virtual networks yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Virtual networks')} variant="compact" borders>
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Network class')}</Th>
                <Th>{t('IPv4 CIDR')}</Th>
                <Th>{t('State')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {vnets.map((vnet) => (
                <Tr key={vnet.id}>
                  <Td dataLabel={t('Name')}>
                    <Button
                      variant="link"
                      isInline
                      onClick={() => navigate(`/networks/${vnet.id}`)}
                    >
                      {resourceDisplayName(vnet.metadata, vnet.id)}
                    </Button>
                  </Td>
                  <Td dataLabel={t('Network class')}>{vnet.spec?.networkClass || '—'}</Td>
                  <Td dataLabel={t('IPv4 CIDR')}>{vnet.spec?.ipv4Cidr || '—'}</Td>
                  <Td dataLabel={t('State')}>
                    <NetworkStatusLabel state={vnet.status?.state} />
                  </Td>
                  <Td dataLabel={t('Actions')} isActionCell>
                    <ActionsColumn
                      items={[
                        {
                          title: t('Delete'),
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
          resourceKind={t('virtual network')}
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

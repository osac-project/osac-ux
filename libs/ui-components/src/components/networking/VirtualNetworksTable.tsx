import { Link } from 'react-router-dom';
import { Content, Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { VirtualNetwork } from '@osac/types';

import VirtualNetworkDetailsActionsMenu from './VirtualNetworkDetailsActionsMenu';
import { VirtualNetworkStatusLabel } from './VirtualNetworkStatusLabel';
import type { NatGatewayWithAddress } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';

import './VirtualNetworksTable.css';

interface VirtualNetworksTableProps {
  virtualNetworks: VirtualNetwork[];
  subnetCountByVN: Record<string, number>;
  securityGroupCountByVN: Record<string, number>;
  natGatewaysByVirtualNetworkId: Record<string, NatGatewayWithAddress | undefined>;
}

export const VirtualNetworksTable = ({
  virtualNetworks,
  subnetCountByVN,
  securityGroupCountByVN,
  natGatewaysByVirtualNetworkId,
}: VirtualNetworksTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Virtual networks')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('IPv4 CIDR')}</Th>
          <Th>{t('IPv6 CIDR')}</Th>
          <Th>{t('Subnets')}</Th>
          <Th>{t('Security groups')}</Th>
          <Th>{t('NAT gateway')}</Th>
          <Th>{t('Actions')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {virtualNetworks.map((vn) => {
          const name = vn.metadata?.name || vn.id;
          const subnetCount = subnetCountByVN[vn.id] || 0;
          const natGatewayWithAddress = natGatewaysByVirtualNetworkId[vn.id];
          const natGateway = natGatewayWithAddress?.natGateway;
          const address = natGatewayWithAddress?.address;

          return (
            <Tr key={vn.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/networking/virtual-networks/${encodeURIComponent(vn.id)}`}
                      className="virtual-networks-table__name-link"
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Status')}>
                <VirtualNetworkStatusLabel state={vn.status?.state} />
              </Td>
              <Td dataLabel={t('IPv4 CIDR')}>{vn.spec?.ipv4Cidr ?? '—'}</Td>
              <Td dataLabel={t('IPv6 CIDR')}>{vn.spec?.ipv6Cidr ?? '—'}</Td>
              <Td dataLabel={t('Subnets')}>{subnetCount}</Td>
              <Td dataLabel={t('Security groups')}>{securityGroupCountByVN[vn.id] || 0}</Td>
              <Td dataLabel={t('NAT gateway')}>
                {natGateway ? (
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                    <FlexItem>{natGateway.metadata?.name ?? natGateway.id}</FlexItem>
                    <FlexItem>
                      <Content component="small" className="virtual-networks-table__meta">
                        {address ?? '—'}
                      </Content>
                    </FlexItem>
                  </Flex>
                ) : (
                  '—'
                )}
              </Td>
              <Td dataLabel={t('Actions')}>
                <VirtualNetworkDetailsActionsMenu virtualNetwork={vn} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

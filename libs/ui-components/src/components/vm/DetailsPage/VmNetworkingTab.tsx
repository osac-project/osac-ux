import { Link, useNavigate } from 'react-router-dom';
import { Button, Flex, FlexItem, Stack, StackItem, Title } from '@patternfly/react-core';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { useVmNetworkAttachmentRows } from './useVmNetworkAttachmentRows';
import { useTranslation } from '../../../hooks/useTranslation';
import { SubtleContent } from '../../SubtleContent/SubtleContent';

interface VmNetworkingTabProps {
  vm: ComputeInstance;
}

const VmNetworkingTab = ({ vm }: VmNetworkingTabProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rows = useVmNetworkAttachmentRows(vm);

  return (
    <Stack hasGutter className="vm-details__networking">
      <StackItem>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          flexWrap={{ default: 'wrap' }}
        >
          <FlexItem>
            <Title headingLevel="h2" size="lg">
              {t('Networking')}
            </Title>
          </FlexItem>
          <FlexItem>
            <Button
              variant="secondary"
              size="sm"
              icon={<PlusCircleIcon />}
              aria-label={t('Add network')}
              onClick={() => navigate('/networking/virtual-networks?create=virtual-network')}
            >
              {t('Add network')}
            </Button>
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        {rows.length > 0 ? (
          <Table aria-label={t('Networking')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Virtual network')}</Th>
                <Th>{t('Subnet')}</Th>
                <Th>{t('Security groups')}</Th>
                <Th>{t('Internal IP')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, index) => (
                <Tr key={`network-attachment-${index}`}>
                  <Td dataLabel={t('Virtual network')}>
                    {row.virtualNetwork.id ? (
                      <Link
                        className="vm-details__network-link"
                        to={`/networking/virtual-networks/${encodeURIComponent(row.virtualNetwork.id)}`}
                      >
                        {row.virtualNetwork.name}
                      </Link>
                    ) : (
                      row.virtualNetwork.name
                    )}
                  </Td>
                  <Td dataLabel={t('Subnet')}>
                    {row.subnet.id && row.virtualNetworkId ? (
                      <Link
                        className="vm-details__network-link"
                        to={`/networking/virtual-networks/${encodeURIComponent(row.virtualNetworkId)}`}
                      >
                        {row.subnet.name}
                      </Link>
                    ) : (
                      row.subnet.name
                    )}
                  </Td>
                  <Td dataLabel={t('Security groups')}>
                    {row.securityGroups.length > 0
                      ? row.securityGroups.map((securityGroup, securityGroupIndex) => (
                          <span key={securityGroup.id}>
                            {securityGroupIndex > 0 ? ', ' : null}
                            <Link
                              className="vm-details__network-link"
                              to={`/networking/security-groups/${encodeURIComponent(securityGroup.id)}`}
                            >
                              {securityGroup.name}
                            </Link>
                          </span>
                        ))
                      : '—'}
                  </Td>
                  <Td dataLabel={t('Internal IP')}>{vm.status?.internalIpAddress || '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <SubtleContent component="p">{t('No virtual networks configured.')}</SubtleContent>
        )}
      </StackItem>
    </Stack>
  );
};

export default VmNetworkingTab;

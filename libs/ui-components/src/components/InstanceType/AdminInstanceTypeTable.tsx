import { Link } from 'react-router-dom';
import { Content, Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { InstanceType as PrivateInstanceType } from '@osac/types/private';

import AdminInstanceTypeActionsMenu from './AdminInstanceTypeActionsMenu';
import InstanceTypeLifecycleLabel from './InstanceTypeLifecycleLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

import './AdminInstanceTypeTable.css';

interface AdminInstanceTypeTableProps {
  instanceTypes: PrivateInstanceType[];
}

const AdminInstanceTypeTable = ({ instanceTypes }: AdminInstanceTypeTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Instance types')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Lifecycle state')}</Th>
          <Th>{t('vCPUs')}</Th>
          <Th>{t('Memory (GiB)')}</Th>
          <Th>{t('GPUs')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {instanceTypes.map((instanceType) => {
          const name = instanceType.metadata?.name || instanceType.id;
          const gpu = instanceType.spec?.gpu;

          return (
            <Tr key={instanceType.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/admin/infrastructure/instance-types/${encodeURIComponent(instanceType.id)}`}
                      className="instance-types-table__name-link"
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Lifecycle state')}>
                <InstanceTypeLifecycleLabel state={instanceType.spec?.state} />
              </Td>
              <Td dataLabel={t('vCPUs')}>{instanceType.spec?.vcpus ?? '—'}</Td>
              <Td dataLabel={t('Memory (GiB)')}>{instanceType.spec?.memoryGib ?? '—'}</Td>
              <Td dataLabel={t('GPUs')}>
                {gpu?.count != null ? (
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                    <FlexItem>{gpu.count}</FlexItem>
                    {gpu.resourceName ? (
                      <FlexItem>
                        <Content component="small" className="instance-types-table__meta">
                          {gpu.resourceName}
                        </Content>
                      </FlexItem>
                    ) : null}
                  </Flex>
                ) : (
                  '—'
                )}
              </Td>
              <Td dataLabel={t('Created')}>
                <Timestamp value={instanceType.metadata?.creationTimestamp} />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <AdminInstanceTypeActionsMenu instanceType={instanceType} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default AdminInstanceTypeTable;

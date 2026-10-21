import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmActionsMenu } from './VmActionsMenu';
import { useTranslation } from '../../hooks/useTranslation';
import { VmStatusLabel } from '../../VmStatusLabel';

import './VmTable.css';

interface VmTableProps {
  vms: ComputeInstance[];
}

export const VmTable = ({ vms }: VmTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Virtual machines')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Project')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Internal IP')}</Th>
          <Th>{t('External IP')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {vms.map((vm) => {
          const state = vm.status?.state;
          const locked = state === ComputeInstanceState.DELETING;
          const name = vm.metadata?.name || vm.id;
          const project = vm.metadata?.project;
          const internalIp = vm.status?.internalIpAddress;
          const externalIp = vm.status?.externalIpAddress;

          return (
            <Tr key={vm.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    {locked ? (
                      <span className="vms-table__name-link">{name}</span>
                    ) : (
                      <Link
                        to={`/vms/${encodeURIComponent(vm.id)}`}
                        className="vms-table__name-link"
                      >
                        {name}
                      </Link>
                    )}
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Status')}>
                <VmStatusLabel state={state} />
              </Td>
              <Td dataLabel={t('Project')}>
                {project ? (
                  <Link to={`/projects/${encodeURIComponent(project)}`}>{project}</Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td dataLabel={t('Internal IP')}>{locked ? '—' : internalIp || '—'}</Td>
              <Td dataLabel={t('External IP')}>{locked ? '—' : externalIp || '—'}</Td>
              <Td dataLabel={t('Actions')} isActionCell>
                {locked ? null : <VmActionsMenu vm={vm} />}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

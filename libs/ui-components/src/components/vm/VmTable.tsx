/**
 * flow: manage-virtual-machines
 * step: mvm_list_view
 */
import { Link } from 'react-router-dom';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmActionsMenu } from './VmActionsMenu';
import { resourceComplianceResult } from '../../api/v1/compliance';
import { useTranslation } from '../../hooks/useTranslation';
import { VmStatusLabel } from '../../VmStatusLabel';
import { ComplianceStateLabel } from '../compliance/ComplianceStateLabel';

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
          <Th>{t('Status')}</Th>
          <Th>{t('Compliance')}</Th>
          <Th>{t('vCPU')}</Th>
          <Th>{t('Memory')}</Th>
          <Th>{t('IP')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {vms.map((vm) => {
          const state = vm.status?.state;
          const locked = state === ComputeInstanceState.DELETING;
          const name = vm.metadata?.name ?? vm.id;
          const cores = vm.spec?.cores;
          const memoryGib = vm.spec?.memoryGib;
          const ip = vm.status?.publicIpAddress || vm.status?.internalIpAddress;

          return (
            <Tr key={vm.id}>
              <Td dataLabel={t('Name')}>
                {locked ? name : <Link to={`/vms/${vm.id}`}>{name}</Link>}
              </Td>
              <Td dataLabel={t('Status')}>
                <VmStatusLabel state={state} />
              </Td>
              <Td dataLabel={t('Compliance')}>
                <ComplianceStateLabel result={resourceComplianceResult(vm, 'STIG')} />
              </Td>
              <Td dataLabel={t('vCPU')}>{cores ?? '—'}</Td>
              <Td dataLabel={t('Memory')}>{memoryGib != null ? `${memoryGib} GiB` : '—'}</Td>
              <Td dataLabel={t('IP')}>{locked ? '—' : ip || '—'}</Td>
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

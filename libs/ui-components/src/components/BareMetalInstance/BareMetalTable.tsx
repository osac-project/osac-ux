import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { BareMetalInstance, BareMetalInstanceType } from '@osac/types';

import { BareMetalActionsMenu } from './BareMetalActionsMenu';
import { BareMetalStatusLabel } from './BareMetalStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

import './BareMetalTable.css';

interface BareMetalTableProps {
  instances: BareMetalInstance[];
  instanceTypes: BareMetalInstanceType[];
}

export const BareMetalTable = ({ instances, instanceTypes }: BareMetalTableProps) => {
  const { t } = useTranslation();
  const instanceTypeById = new Map(
    instanceTypes.map((instanceType) => [instanceType.id, instanceType]),
  );

  return (
    <Table aria-label={t('Bare metal instances')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Project')}</Th>
          <Th>{t('Configuration')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {instances.map((instance) => {
          const name = instance.metadata?.name || instance.id;
          const instanceType = instance.spec?.instanceType?.id
            ? instanceTypeById.get(instance.spec.instanceType.id)
            : undefined;
          const hardware = instanceType?.spec?.hardware;
          const gpu = hardware?.accelerators.length
            ? hardware.accelerators
                .map((accelerator) =>
                  [
                    accelerator.vendor,
                    accelerator.model,
                    accelerator.memoryGb && `${accelerator.memoryGb} GB`,
                  ]
                    .filter(Boolean)
                    .join(' '),
                )
                .join(', ')
            : '—';

          return (
            <Tr key={instance.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/bare-metal/${encodeURIComponent(instance.id)}`}
                      className="bare-metal-table__name-link"
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Status')}>
                <BareMetalStatusLabel state={instance.status?.state} />
              </Td>
              <Td dataLabel={t('Project')}>{instance.metadata?.project ?? t('Default')}</Td>
              <Td dataLabel={t('Configuration')}>
                <dl className="bare-metal-table__configuration">
                  <div>
                    <dt>{t('CPU')}</dt>
                    <dd>
                      {hardware?.cpu?.cores
                        ? t('{{count}} vCPU', { count: hardware.cpu.cores })
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('RAM')}</dt>
                    <dd>
                      {hardware?.memory?.totalGb
                        ? t('{{count}} GB', { count: Number(hardware.memory.totalGb) })
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('GPU')}</dt>
                    <dd>{gpu}</dd>
                  </div>
                  <div>
                    <dt>{t('OS image')}</dt>
                    <dd>
                      {instance.spec?.diskImage?.name ? (
                        <span className="bare-metal-table__os-image">
                          <CubeIcon aria-hidden />
                          {instance.spec.diskImage.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </Td>
              <Td dataLabel={t('Created')}>
                <Timestamp value={instance.metadata?.creationTimestamp} />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <BareMetalActionsMenu instance={instance} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

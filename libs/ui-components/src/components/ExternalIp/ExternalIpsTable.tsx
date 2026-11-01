import { useState } from 'react';
import { Link } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { Content, Flex, FlexItem } from '@patternfly/react-core';
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { ExternalIPPoolSchema, IPFamily } from '@osac/types';
import type { ExternalIP, ExternalIPPool } from '@osac/types';
import type { ExternalIpAttachedTarget } from '@osac/ui-components/api/v1/external-ip-data';

import ExternalIpAttachedTo from './Details/ExternalIpAttachedTo';
import ExternalIpStatusLabel from './Details/ExternalIpStatusLabel';
import ExternalIpActionsMenu from './ExternalIpActionsMenu';
import { useTranslation } from '../../hooks/useTranslation';

import './ExternalIpsTable.css';

interface ExternalIpsTableProps {
  externalIps: ExternalIP[];
  poolsById: Record<string, ExternalIPPool>;
  attachedTargetsByExternalIpId: Record<string, ExternalIpAttachedTarget>;
}

interface ExternalIpPoolNetworkFields {
  cidr?: string;
  cidrs?: string[];
}

const MOCK_EXTERNAL_IP_POOL_CIDR = '198.51.100.64/26';
const MOCK_EMPTY_EXTERNAL_IP_POOL = create(ExternalIPPoolSchema, {
  id: 'mock-empty-external-ip-pool',
  metadata: { name: 'northsummit-reserved-empty' },
  spec: { ipFamily: IPFamily.IP_FAMILY_IPV4 },
  status: { available: 62n },
});

const getPoolCidr = (pool: ExternalIPPool | undefined): string => {
  const spec = pool?.spec as (ExternalIPPool['spec'] & ExternalIpPoolNetworkFields) | undefined;
  return spec?.cidrs?.join(', ') || spec?.cidr || MOCK_EXTERNAL_IP_POOL_CIDR;
};

const getPoolCapacity = (pool: ExternalIPPool | undefined, allocatedCount: number): string => {
  if (pool?.status?.available === undefined) {
    return '—';
  }
  const available = pool.status.available;
  const total = available + BigInt(allocatedCount);
  return `${available.toString()} of ${total.toString()} available`;
};

/** Bmaas-style single IP row shown in the expanded body. */
const ExternalIpEntry = ({ ip, target }: { ip: ExternalIP; target?: ExternalIpAttachedTarget }) => {
  return (
    <div className="external-ips-table__entry">
      <div className="external-ips-table__entry-primary">
        <span className="external-ips-table__entry-address">{ip.status?.address ?? '—'}</span>
        <ExternalIpStatusLabel state={ip.status?.state} attached={ip.status?.attached} />
      </div>
      <ExternalIpAttachedTo attached={ip.status?.attached} target={target} />
    </div>
  );
};

interface PoolGroup {
  poolId: string;
  pool?: ExternalIPPool;
  ips: ExternalIP[];
}

const buildPoolGroups = (
  externalIps: ExternalIP[],
  poolsById: Record<string, ExternalIPPool>,
): PoolGroup[] => {
  const order: string[] = [];
  const byPoolId = new Map<string, ExternalIP[]>();

  for (const ip of externalIps) {
    const poolId = ip.spec?.pool?.id ?? ip.status?.pool ?? ip.id;
    if (!byPoolId.has(poolId)) {
      order.push(poolId);
      byPoolId.set(poolId, []);
    }
    const poolIps = byPoolId.get(poolId);
    if (poolIps) {
      poolIps.push(ip);
    }
  }

  const groups = order.map((poolId) => ({
    poolId,
    pool: poolsById[poolId],
    ips: byPoolId.get(poolId) ?? [],
  }));

  if (!groups.some(({ poolId }) => poolId === MOCK_EMPTY_EXTERNAL_IP_POOL.id)) {
    groups.push({
      poolId: MOCK_EMPTY_EXTERNAL_IP_POOL.id,
      pool: MOCK_EMPTY_EXTERNAL_IP_POOL,
      ips: [],
    });
  }

  return groups;
};

const ExternalIpsTable = ({
  externalIps,
  poolsById,
  attachedTargetsByExternalIpId,
}: ExternalIpsTableProps) => {
  const { t } = useTranslation();
  const [expandedPoolIds, setExpandedPoolIds] = useState<Set<string>>(new Set());

  const groups = buildPoolGroups(externalIps, poolsById);

  const togglePool = (poolId: string) => {
    setExpandedPoolIds((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) {
        next.delete(poolId);
      } else {
        next.add(poolId);
      }
      return next;
    });
  };

  return (
    <Table aria-label={t('External IPs')} variant="compact">
      <Thead>
        <Tr>
          <Th />
          <Th>{t('Pool')}</Th>
          <Th>{t('CIDR')}</Th>
          <Th>{t('Capacity')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      {groups.map(({ poolId, pool, ips }, rowIndex) => {
        const inUseCount = ips.filter((ip) => ip.status?.attached).length;
        const availableCount = ips.length - inUseCount;
        const isExpandable = inUseCount > 1;
        const isExpanded = isExpandable && expandedPoolIds.has(poolId);
        const poolName = pool?.metadata?.name ?? poolId;
        // Use the first IP for single-IP pool actions; use pool-level data otherwise
        const firstIp = ips[0];

        return (
          <Tbody key={poolId} isExpanded={isExpanded}>
            <Tr>
              <Td
                expand={
                  isExpandable
                    ? {
                        rowIndex,
                        isExpanded,
                        onToggle: () => togglePool(poolId),
                        expandId: `${poolId}-expand`,
                      }
                    : undefined
                }
              />
              <Td dataLabel={t('Pool')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/networking/external-ips/${encodeURIComponent(poolId)}`}
                      className="external-ips-table__name-link"
                    >
                      {poolName}
                    </Link>
                  </FlexItem>
                  <FlexItem>
                    <Content component="small" className="external-ips-table__name-meta">
                      {t('{{inUse}} in use · {{available}} available', {
                        inUse: inUseCount,
                        available: availableCount,
                      })}
                    </Content>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('CIDR')}>{getPoolCidr(pool)}</Td>
              <Td dataLabel={t('Capacity')}>{getPoolCapacity(pool, ips.length)}</Td>
              <Td dataLabel={t('Actions')} isActionCell>
                {firstIp && <ExternalIpActionsMenu externalIp={firstIp} />}
              </Td>
            </Tr>
            {isExpandable && (
              <Tr isExpanded={isExpanded}>
                <Td colSpan={5} noPadding>
                  <ExpandableRowContent>
                    <ul
                      className="external-ips-table__ip-list"
                      aria-label={t('IPs in pool {{name}}', { name: poolName })}
                    >
                      {ips.map((ip) => (
                        <li key={ip.id} className="external-ips-table__ip-item">
                          <ExternalIpEntry ip={ip} target={attachedTargetsByExternalIpId[ip.id]} />
                        </li>
                      ))}
                    </ul>
                  </ExpandableRowContent>
                </Td>
              </Tr>
            )}
          </Tbody>
        );
      })}
    </Table>
  );
};

export default ExternalIpsTable;

import { Card, CardBody } from '@patternfly/react-core';
import { RhUiConnectedIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-connected-icon';

import type { ExternalIP, ExternalIPPool } from '@osac/types';
import type { ExternalIpAttachedTarget } from '@osac/ui-components/api/v1/external-ip-data';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ExternalIpAttachedTo from '../ExternalIp/Details/ExternalIpAttachedTo';
import ExternalIpStatusLabel from '../ExternalIp/Details/ExternalIpStatusLabel';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';

import './ExternalIpPoolCard.css';
import '../ExternalIp/ExternalIpsTable.css';

interface ExternalIpPoolNetworkFields {
  cidr?: string;
  cidrs?: string[];
}

function resolveCidr(pool: ExternalIPPool): string {
  const spec = pool.spec as (ExternalIPPool['spec'] & ExternalIpPoolNetworkFields) | undefined;
  return spec?.cidrs?.join(', ') ?? spec?.cidr ?? '—';
}

export interface ExternalIpPoolTenantCardProps {
  pool: ExternalIPPool;
  ips: ExternalIP[];
  attachedTargetsByExternalIpId: Record<string, ExternalIpAttachedTarget>;
}

const ExternalIpPoolTenantCard = ({
  pool,
  ips,
  attachedTargetsByExternalIpId,
}: ExternalIpPoolTenantCardProps) => {
  const { t } = useTranslation();

  const inUseCount = ips.filter((ip) => ip.status?.attached).length;
  const availableCount = ips.length - inUseCount;

  const available = pool.status?.available ?? BigInt(availableCount);
  const allocated = pool.status?.allocated ?? BigInt(inUseCount);
  const total = pool.status?.total ?? available + allocated;

  return (
    <Card isFullHeight className="external-ip-pool-card">
      <CardBody>
        {/* Header */}
        <div className="external-ip-pool-card__header">
          <span className="external-ip-pool-card__icon" aria-hidden="true">
            <RhUiConnectedIcon />
          </span>
          <div className="external-ip-pool-card__header-actions">
            <ExternalIpPoolStatusLabel state={pool.status?.state} />
          </div>
        </div>

        {/* Title + meta */}
        <div className="external-ip-pool-card__primary-cell">
          <span className="external-ip-pool-card__title-link">
            {pool.metadata?.name ?? pool.id}
          </span>
          <span className="external-ip-pool-card__pool-meta">
            {t('{{inUse}} in use · {{available}} available', {
              inUse: inUseCount,
              available: availableCount,
            })}
          </span>
        </div>

        {/* Specs */}
        <dl className="external-ip-pool-card__specs-list">
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">{t('CIDR')}</dt>
            <dd className="external-ip-pool-card__spec-value">{resolveCidr(pool)}</dd>
          </div>
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">{t('Managed by')}</dt>
            <dd className="external-ip-pool-card__spec-value">{t('Provider administrator')}</dd>
          </div>
        </dl>

        {/* Capacity */}
        <div
          className="external-ip-pool-card__capacity"
          aria-label={t('External IP pool capacity')}
        >
          <span className="external-ip-pool-card__capacity-heading">{t('Capacity')}</span>
          <dl className="external-ip-pool-card__capacity-stats">
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('Available')}</dt>
              <dd>{available.toString()}</dd>
            </div>
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('In use')}</dt>
              <dd>{allocated.toString()}</dd>
            </div>
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('Total')}</dt>
              <dd>{total.toString()}</dd>
            </div>
          </dl>
        </div>
      </CardBody>
    </Card>
  );
};

export default ExternalIpPoolTenantCard;

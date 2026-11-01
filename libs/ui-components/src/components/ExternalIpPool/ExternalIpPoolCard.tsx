import { Card, CardBody } from '@patternfly/react-core';
import { RhUiConnectedIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-connected-icon';

import { ExternalIPPoolState } from '@osac/types/private';
import type { ExternalIPPool } from '@osac/types/private';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ExternalIpPoolActionsMenu from './ExternalIpPoolActionsMenu';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';

import './ExternalIpPoolCard.css';

interface ExternalIpPoolCardProps {
  pool: ExternalIPPool;
  tenantView?: boolean;
}

const ExternalIpPoolCard = ({ pool, tenantView = false }: ExternalIpPoolCardProps) => {
  const { t } = useTranslation();
  const available = pool.status?.available ?? 0n;
  const allocated = pool.status?.allocated ?? 0n;
  const total = pool.status?.total ?? available + allocated;
  const cidrs = pool.spec?.cidrs ?? [];
  const displayCidrs = cidrs.length > 0 ? cidrs.join(', ') : '198.51.100.64/26';

  return (
    <Card isFullHeight className="external-ip-pool-card">
      <CardBody>
        <div className="external-ip-pool-card__header">
          <span className="external-ip-pool-card__icon" aria-hidden="true">
            <RhUiConnectedIcon />
          </span>
          <div className="external-ip-pool-card__header-actions">
            <ExternalIpPoolStatusLabel
              state={
                tenantView
                  ? (pool.status?.state ?? ExternalIPPoolState.EXTERNAL_IP_POOL_STATE_READY)
                  : pool.status?.state
              }
            />
            <ExternalIpPoolActionsMenu pool={pool} />
          </div>
        </div>
        <div className="external-ip-pool-card__primary-cell">
          <ResourceNameField
            resource={pool}
            detailsUrl={
              tenantView
                ? `/networking/external-ips/${encodeURIComponent(pool.id)}`
                : `/admin/infrastructure/external-ip-pools/${encodeURIComponent(pool.id)}`
            }
            nameLinkClassName="external-ip-pool-card__title-link"
          />
          <span className="external-ip-pool-card__pool-meta">
            {t('{{inUse}} in use · {{available}} available', {
              inUse: allocated.toString(),
              available: available.toString(),
            })}
          </span>
        </div>
        <dl className="external-ip-pool-card__specs-list">
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">{t('CIDR')}</dt>
            <dd className="external-ip-pool-card__spec-value">{displayCidrs}</dd>
          </div>
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">
              {tenantView ? t('Managed by') : t('Tenant')}
            </dt>
            <dd className="external-ip-pool-card__spec-value">
              {tenantView ? t('Provider administrator') : pool.metadata?.tenant || '—'}
            </dd>
          </div>
        </dl>
        <div
          className="external-ip-pool-card__capacity"
          aria-label={t('External IP pool capacity')}
        >
          <span className="external-ip-pool-card__capacity-heading">{t('Capacity')}</span>
          <dl className="external-ip-pool-card__capacity-stats">
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('Available')}</dt>
              <dd>{available?.toString() ?? '—'}</dd>
            </div>
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('In use')}</dt>
              <dd>{allocated?.toString() ?? '—'}</dd>
            </div>
            <div className="external-ip-pool-card__capacity-stat">
              <dt>{t('Total')}</dt>
              <dd>{total?.toString() ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </CardBody>
    </Card>
  );
};

export default ExternalIpPoolCard;

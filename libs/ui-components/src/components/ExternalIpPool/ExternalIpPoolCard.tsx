import { Card, CardBody } from '@patternfly/react-core';
import { RhUiConnectedIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-connected-icon';

import type { ExternalIPPool } from '@osac/types/private';
import ResourceNameField from '@osac/ui-components/components/Resource/ResourceNameField.tsx';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import ExternalIpPoolActionsMenu from './ExternalIpPoolActionsMenu';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';

import './ExternalIpPoolCard.css';

interface ExternalIpPoolCardProps {
  pool: ExternalIPPool;
}

const ExternalIpPoolCard = ({ pool }: ExternalIpPoolCardProps) => {
  const { t } = useTranslation();
  const available = pool.status?.available;
  const allocated = pool.status?.allocated;
  const total = pool.status?.total;
  const cidrs = pool.spec?.cidrs ?? [];

  return (
    <Card isFullHeight className="external-ip-pool-card">
      <CardBody>
        <div className="external-ip-pool-card__header">
          <span className="external-ip-pool-card__icon" aria-hidden="true">
            <RhUiConnectedIcon />
          </span>
          <div className="external-ip-pool-card__header-actions">
            <ExternalIpPoolStatusLabel state={pool.status?.state} />
            <ExternalIpPoolActionsMenu pool={pool} />
          </div>
        </div>
        <div className="external-ip-pool-card__primary-cell">
          <ResourceNameField
            resource={pool}
            detailsUrl={`/admin/infrastructure/external-ip-pools/${encodeURIComponent(pool.id)}`}
            nameLinkClassName="external-ip-pool-card__title-link"
          />
          <span className="external-ip-pool-card__pool-meta">
            {t('{{inUse}} in use · {{available}} available', {
              inUse: pool.status?.allocated?.toString() ?? '0',
              available: pool.status?.available?.toString() ?? '0',
            })}
          </span>
        </div>
        <dl className="external-ip-pool-card__specs-list">
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">{t('CIDR')}</dt>
            <dd className="external-ip-pool-card__spec-value">
              {cidrs.length > 0 ? cidrs.join(', ') : '—'}
            </dd>
          </div>
          <div className="external-ip-pool-card__spec-row">
            <dt className="external-ip-pool-card__spec-label">{t('Tenant')}</dt>
            <dd className="external-ip-pool-card__spec-value">
              {pool.metadata?.tenant || '—'}
            </dd>
          </div>
        </dl>
        <div className="external-ip-pool-card__capacity" aria-label={t('External IP pool capacity')}>
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

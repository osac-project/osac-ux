import { Link } from 'react-router-dom';
import { Button, Content, Flex, FlexItem, Progress, Title } from '@patternfly/react-core';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';

import type { ExternalIP } from '@osac/types';
import type { ExternalIPPool } from '@osac/types/private';

import type { ExternalIpAttachedTarget } from '../../api/v1/external-ip-data';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import ExternalIpAttachedTo from '../ExternalIp/Details/ExternalIpAttachedTo';
import ExternalIpStatusLabel from '../ExternalIp/Details/ExternalIpStatusLabel';

import './ExternalIpPoolDetailsPageContent.css';
import '../shared/details-page.css';

interface ExternalIpPoolIpsSidebarSectionProps {
  pool: ExternalIPPool;
  tenantView?: boolean;
  externalIps?: ExternalIP[];
  attachedTargetsByExternalIpId?: Record<string, ExternalIpAttachedTarget>;
}

const ExternalIpPoolIpsSidebarSection = ({
  pool,
  tenantView = false,
  externalIps = [],
  attachedTargetsByExternalIpId = {},
}: ExternalIpPoolIpsSidebarSectionProps) => {
  const { t } = useTranslation();
  const allocated = tenantView ? (pool.status?.allocated ?? 0n) : pool.status?.allocated;
  const available = tenantView ? (pool.status?.available ?? 62n) : pool.status?.available;
  const total = tenantView
    ? (pool.status?.total ?? (available ?? 0n) + (allocated ?? 0n))
    : pool.status?.total;
  const percent =
    pool.status && pool.status.total > 0n
      ? Number((pool.status.allocated * 100n) / pool.status.total)
      : 0;
  const allocatedLabel = t('{{allocated}} of {{total}} addresses allocated', {
    allocated: allocated?.toString() ?? '0',
    total: total?.toString() ?? '0',
  });
  const percentLabel = t('{{percent}}%', { percent });
  const usedIps = externalIps.filter((externalIp) => externalIp.status?.attached);

  return (
    <div className="details-page__sidebar">
      <Flex
        className="details-page__sidebar-header"
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <FlexItem>
          <Title headingLevel="h2" size="md" className="details-page__sidebar-title">
            {t('IPs')}
          </Title>
        </FlexItem>
        {tenantView && (
          <FlexItem>
            <Button
              component={(props) => <Link {...props} to="/networking/external-ips/create" />}
              variant="link"
              icon={<PlusIcon />}
            >
              {t('Create')}
            </Button>
          </FlexItem>
        )}
      </Flex>

      {tenantView && allocated === 0n ? (
        <Content component="p" className="details-page__sidebar-description">
          {t('No IPs have been allocated from this pool yet.')}
        </Content>
      ) : null}

      <Progress
        title={allocatedLabel}
        label={percentLabel}
        measureLocation="top"
        size="sm"
        value={percent}
        valueText={percentLabel}
        aria-label={allocatedLabel}
      />

      <dl
        className="external-ip-pool-details__capacity-stats"
        aria-label={t('External IP pool capacity')}
      >
        <div className="external-ip-pool-details__capacity-stat">
          <dt className="external-ip-pool-details__capacity-stat-label">{t('Available')}</dt>
          <dd className="external-ip-pool-details__capacity-stat-value">
            {available !== undefined ? `${available}` : displayValue()}
          </dd>
        </div>
        <div className="external-ip-pool-details__capacity-stat">
          <dt className="external-ip-pool-details__capacity-stat-label">{t('In use')}</dt>
          <dd className="external-ip-pool-details__capacity-stat-value">
            {allocated !== undefined ? `${allocated}` : displayValue()}
          </dd>
        </div>
        <div className="external-ip-pool-details__capacity-stat">
          <dt className="external-ip-pool-details__capacity-stat-label">{t('Total')}</dt>
          <dd className="external-ip-pool-details__capacity-stat-value">
            {total !== undefined ? `${total}` : displayValue()}
          </dd>
        </div>
      </dl>

      {usedIps.length > 0 && (
        <div className="external-ip-pool-details__used-ips" aria-label={t('IPs in use')}>
          {usedIps.map((externalIp) => (
            <div className="external-ip-pool-details__used-ip" key={externalIp.id}>
              <div className="external-ip-pool-details__used-ip-address">
                <span>{externalIp.status?.address ?? '—'}</span>
                <ExternalIpStatusLabel
                  state={externalIp.status?.state}
                  attached={externalIp.status?.attached}
                />
              </div>
              <ExternalIpAttachedTo
                attached={externalIp.status?.attached}
                target={attachedTargetsByExternalIpId[externalIp.id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExternalIpPoolIpsSidebarSection;

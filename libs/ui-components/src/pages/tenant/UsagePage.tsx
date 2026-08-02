/**
 * flow: tenant-user / tenant-admin
 * route: /usage
 *
 * @temp-api (OSAC-985) — Estimated usage for the signed-in user's tenant. Real
 * implementation queries Koku's cost report API tagged by organization_id.
 */
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';

import { UsageSummaryCard } from '../../components/metering/UsageSummaryCard';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';

export const UsagePage = () => {
  const { t } = useTranslation();
  const { tenantId } = useSession();
  const [period, setPeriod] = useState<'current_month' | 'last_month'>('current_month');

  return (
    <ListPage
      title={t('Usage')}
      description={t(
        'Estimated resource usage and cost for your organization. Figures are estimates until Koku billing integration ships (Milestone 0.4).',
      )}
      actions={
        <ToggleGroup aria-label={t('Billing period')}>
          <ToggleGroupItem
            text={t('Current month')}
            isSelected={period === 'current_month'}
            onChange={() => setPeriod('current_month')}
          />
          <ToggleGroupItem
            text={t('Last month')}
            isSelected={period === 'last_month'}
            onChange={() => setPeriod('last_month')}
          />
        </ToggleGroup>
      }
    >
      <ListPageBody isLoading={false} error={undefined}>
        <UsageSummaryCard tenantId={tenantId} period={period} />
      </ListPageBody>
    </ListPage>
  );
};

export default UsagePage;

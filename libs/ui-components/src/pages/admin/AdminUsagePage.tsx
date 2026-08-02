/**
 * flow: tenant-admin
 * route: /admin/usage
 *
 * @temp-api (OSAC-985) — Organization-wide estimated usage for the tenant admin's
 * organization. Real implementation queries Koku's cost report API tagged by
 * organization_id (never client-asserted).
 */
import { useEffect, useState } from 'react';
import { Flex, Label, Skeleton, ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';

import { type MeteringUsageSummary, fetchMeteringUsage } from '../../api/metering/usage';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { UsageSummaryCard } from '../../components/metering/UsageSummaryCard';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';

const RESOURCE_KIND_COUNT = (summary: MeteringUsageSummary | null, kind: string): number =>
  summary?.resources.filter((r) => r.resourceType === kind).length ?? 0;

export const AdminUsagePage = () => {
  const { t } = useTranslation();
  const { tenantId } = useSession();
  const [period, setPeriod] = useState<'current_month' | 'last_month'>('current_month');
  const [summary, setSummary] = useState<MeteringUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchMeteringUsage({ demo: true, tenantId, period })
      .then(setSummary)
      .finally(() => setIsLoading(false));
  }, [tenantId, period]);

  return (
    <ListPage
      title={t('Organization usage')}
      description={t(
        'Estimated resource usage and cost across your organization. Figures are estimates until Koku billing integration ships (Milestone 0.4).',
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
        {isLoading ? (
          <Skeleton width="100%" height="80px" screenreaderText={t('Loading usage metrics')} />
        ) : (
          <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
            <DashboardMetricCard
              label={t('Est. cost this period')}
              value={summary ? `$${summary.totalEstimatedCost.toFixed(2)}` : '—'}
            />
            <DashboardMetricCard
              label={t('Virtual machines')}
              value={RESOURCE_KIND_COUNT(summary, 'compute_instance')}
            />
            <DashboardMetricCard
              label={t('Clusters')}
              value={RESOURCE_KIND_COUNT(summary, 'cluster')}
            />
            <DashboardMetricCard
              label={t('AI model access')}
              value={RESOURCE_KIND_COUNT(summary, 'model_access')}
            />
          </Flex>
        )}

        <div style={{ margin: '0.75rem 0 1rem' }}>
          <Label isCompact color="yellow" variant="outline">
            {t('Estimated — billing not yet active (Milestone 0.3)')}
          </Label>
        </div>

        <UsageSummaryCard tenantId={tenantId} period={period} />
      </ListPageBody>
    </ListPage>
  );
};

export default AdminUsagePage;

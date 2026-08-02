/**
 * flow: provider-admin (CSP Admin — Billing capability, no new persona)
 * route: /provider/billing
 *
 * Billing is a capability folded into the existing CSP Admin (providerAdmin)
 * role — not a new persona. See osac-ux redesign plan §Authorship model.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Flex, Gallery, GalleryItem, Label, Title } from '@patternfly/react-core';

import { fetchAllTenantsMeteringUsage } from '../../api/metering/usage';
import { usePricePlans } from '../../api/v1/price-plan';
import { useTenants } from '../../api/v1/tenant';
import { DashboardActionTile } from '../../components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const BILLING_TILES = [
  {
    id: 'billing-plans',
    label: 'Price plans',
    icon: '💳',
    desc: 'Define rate overrides and assign them to tenants as price plans.',
    path: '/provider/billing/plans',
  },
  {
    id: 'billing-tenants',
    label: 'Tenant billing',
    icon: '🏷️',
    desc: 'Assign price plan, affiliate ID, and billing model per tenant.',
    path: '/provider/billing/tenants',
  },
  {
    id: 'billing-usage',
    label: 'Usage & cost reports',
    icon: '📊',
    desc: 'Cross-tenant estimated usage for the current billing period.',
    path: '/provider/billing/usage',
  },
];

export const ProviderBillingDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = useTenants();
  const { data: plans = [], isLoading: plansLoading } = usePricePlans();
  const [totalCost, setTotalCost] = useState<number | null>(null);

  useEffect(() => {
    fetchAllTenantsMeteringUsage({ demo: true }).then((summaries) =>
      setTotalCost(summaries.reduce((sum, s) => sum + s.totalEstimatedCost, 0)),
    );
  }, []);

  return (
    <ListPage
      title={t('Billing')}
      description={t(
        'Composite billing architecture — BillableComponent rates declared on templates, overridden per price plan, and applied to tenants. Gated on the M360-vs-Koku architectural decision (REQ-BA-3).',
      )}
    >
      <ListPageBody isLoading={tenantsLoading || plansLoading} error={tenantsError}>
        <Alert
          variant="warning"
          isInline
          title={t('M360-vs-Koku decision pending (REQ-BA-3)')}
          style={{ marginBottom: '1rem' }}
        >
          {t(
            'Billing fields shown here are predicted (@temp-api) and not backed by a real metering or cost-management service yet. See the "Metering & Billing" architecture notes for details.',
          )}
        </Alert>

        <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
          <DashboardMetricCard label={t('Tenants')} value={tenants.length} />
          <DashboardMetricCard label={t('Price plans')} value={plans.length} />
          <DashboardMetricCard
            label={t('Est. cost this period')}
            value={totalCost != null ? `$${totalCost.toFixed(2)}` : '—'}
          />
        </Flex>

        <div style={{ marginTop: '0.5rem' }}>
          <Label isCompact color="yellow" variant="outline">
            {t('Estimated — billing not yet active (Milestone 0.3)')}
          </Label>
        </div>

        <Title headingLevel="h2" size="xl" style={{ marginTop: '1.5rem' }}>
          {t('Billing areas')}
        </Title>
        <Gallery hasGutter minWidths={{ default: '220px' }}>
          {BILLING_TILES.map((tile) => (
            <GalleryItem key={tile.id}>
              <DashboardActionTile
                icon={tile.icon}
                title={t(tile.label)}
                description={t(tile.desc)}
                actionLabel={t('Go to {{label}} →', { label: tile.label.toLowerCase() })}
                onAction={() => navigate(tile.path)}
              />
            </GalleryItem>
          ))}
        </Gallery>
      </ListPageBody>
    </ListPage>
  );
};

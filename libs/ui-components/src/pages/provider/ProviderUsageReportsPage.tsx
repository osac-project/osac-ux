/**
 * flow: provider-admin (CSP Admin — Billing capability)
 * route: /provider/billing/usage
 *
 * @temp-api (OSAC-985) — Cross-tenant usage / cost report. Real implementation
 * queries Koku's cost report API tagged by organization_id (never client-asserted).
 */
import { useEffect, useState } from 'react';
import { Alert, Label, Skeleton, Stack, StackItem, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { type MeteringUsageSummary, fetchAllTenantsMeteringUsage } from '../../api/metering/usage';
import { useTenants } from '../../api/v1/tenant';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  compute_instance: 'VM',
  cluster: 'Cluster',
  baremetal_instance: 'Bare Metal',
  model_access: 'AI Model',
};

export const ProviderUsageReportsPage = () => {
  const { t } = useTranslation();
  const { data: tenants = [] } = useTenants();
  const [summaries, setSummaries] = useState<MeteringUsageSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchAllTenantsMeteringUsage({ demo: true })
      .then(setSummaries)
      .catch((e) => setError(e instanceof Error ? e.message : t('Failed to load usage')))
      .finally(() => setIsLoading(false));
  }, [t]);

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.metadata?.name ?? id;
  const grandTotal = (summaries ?? []).reduce((sum, s) => sum + s.totalEstimatedCost, 0);

  return (
    <ListPage
      title={t('Usage & cost reports')}
      description={t(
        'Estimated cross-tenant usage for the current billing period. Milestone 0.3 (metering data collection) — cost figures are estimates until Koku billing integration ships (REQ-BA-3).',
      )}
    >
      <ListPageBody isLoading={false} error={undefined}>
        <Stack hasGutter>
          <StackItem>
            <Label isCompact color="yellow" variant="outline">
              {t('Estimated — billing not yet active (Milestone 0.3)')}
            </Label>
          </StackItem>

          {isLoading && <Skeleton width="240px" screenreaderText={t('Loading usage reports')} />}
          {error && <Alert variant="danger" isInline title={error} />}

          {summaries && (
            <>
              <StackItem>
                <Title headingLevel="h2" size="lg">
                  {t('Total estimated cost — all tenants: {{total}} USD', {
                    total: `$${grandTotal.toFixed(2)}`,
                  })}
                </Title>
              </StackItem>
              {summaries.map((summary) => (
                <StackItem key={summary.tenantId}>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: '0.5rem' }}>
                    {t('{{tenant}} — {{total}} USD', {
                      tenant: tenantName(summary.tenantId),
                      total: `$${summary.totalEstimatedCost.toFixed(2)}`,
                    })}
                  </Title>
                  {summary.resources.length === 0 ? (
                    <Alert variant="info" isInline title={t('No metered resources this period')} />
                  ) : (
                    <Table
                      aria-label={t('Usage for {{tenantId}}', { tenantId: summary.tenantId })}
                      variant="compact"
                    >
                      <Thead>
                        <Tr>
                          <Th>{t('Resource')}</Th>
                          <Th>{t('Type')}</Th>
                          <Th>{t('Class / Model')}</Th>
                          <Th>{t('Est. cost')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {summary.resources.map((r) => (
                          <Tr key={r.resourceId}>
                            <Td dataLabel={t('Resource')}>{r.resourceName}</Td>
                            <Td dataLabel={t('Type')}>
                              {t(RESOURCE_TYPE_LABELS[r.resourceType] ?? r.resourceType)}
                            </Td>
                            <Td dataLabel={t('Class / Model')}>
                              {r.resourceType === 'model_access' ? r.modelName : r.resourceClass}
                            </Td>
                            <Td dataLabel={t('Est. cost')}>${r.estimatedCost.toFixed(4)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </StackItem>
              ))}
            </>
          )}
        </Stack>
      </ListPageBody>
    </ListPage>
  );
};

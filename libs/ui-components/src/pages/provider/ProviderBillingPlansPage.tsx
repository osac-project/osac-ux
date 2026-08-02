/**
 * flow: provider-admin (CSP Admin — Billing capability)
 * route: /provider/billing/plans
 *
 * @temp-api — fronts the predicted v1/price_plans endpoint (REQ-BA-4).
 * A PricePlan maps to a Koku Cost Model in the real architecture.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Content, Label } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { PricePlan } from '../../api/v1/billing-types';
import { useDeletePricePlan, usePricePlans } from '../../api/v1/price-plan';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { useTranslation } from '../../hooks/useTranslation';

const TIER_COLOR: Record<string, 'blue' | 'purple' | 'yellow' | 'grey'> = {
  standard: 'blue',
  reseller: 'purple',
  gov: 'yellow',
};

export const ProviderBillingPlansPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans = [], isLoading, error } = usePricePlans();
  const deletePlan = useDeletePricePlan();
  const [pendingDelete, setPendingDelete] = useState<PricePlan | null>(null);

  return (
    <>
      <ListPage
        title={t('Price plans')}
        description={t(
          'Rate overrides that can be assigned to a tenant. Each plan maps to a Koku Cost Model — meters not overridden here fall back to the BillableComponent base rate declared on the template.',
        )}
        actions={
          <Button variant="primary" onClick={() => navigate('/provider/billing/plans/new')}>
            {t('Create price plan')}
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          {plans.length === 0 ? (
            <Alert variant="info" isInline title={t('No price plans defined')}>
              {t(
                'All tenants use base BillableComponent rates until a plan is created and assigned.',
              )}
            </Alert>
          ) : (
            <Table aria-label={t('Price plans')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Tier')}</Th>
                  <Th>{t('Description')}</Th>
                  <Th>{t('Rate overrides')}</Th>
                  <Th>{t('Default')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {plans.map((plan) => (
                  <Tr key={plan.id}>
                    <Td dataLabel={t('Name')}>
                      <strong>{plan.title}</strong>
                    </Td>
                    <Td dataLabel={t('Tier')}>
                      <Label isCompact color={TIER_COLOR[plan.tier] ?? 'grey'}>
                        {plan.tier}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Description')}>
                      <Content component="small">{plan.description || '—'}</Content>
                    </Td>
                    <Td dataLabel={t('Rate overrides')}>
                      {Object.keys(plan.rateOverrides ?? {}).length === 0
                        ? '—'
                        : Object.entries(plan.rateOverrides).map(([k, v]) => (
                            <div key={k}>
                              <code style={{ fontSize: '0.8em' }}>
                                {k}: ${v}
                              </code>
                            </div>
                          ))}
                    </Td>
                    <Td dataLabel={t('Default')}>
                      {plan.isDefault ? (
                        <Label isCompact color="green">
                          {t('Default')}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: () => navigate(`/provider/billing/plans/${plan.id}/edit`),
                          },
                          {
                            title: t('Delete'),
                            onClick: () => setPendingDelete(plan),
                            isDanger: true,
                            isDisabled: plan.isDefault,
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title}
          resourceKind={t('price plan')}
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deletePlan.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deletePlan.error}
        />
      )}
    </>
  );
};

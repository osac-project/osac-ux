/**
 * flow: admin-maas-subscriptions
 * route: /admin/ai-subscriptions (tenantAdmin)
 *
 * Tenant Admin: Configure Subscriptions — the atomic unit of MaaS governance.
 * Group access maps to Authorino, rate limits to Limiter, quotas are
 * token-based, and idpRef ties the subscription to a tenant IDP.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Label,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useMaaSCatalogItems } from '../../api/v1/maas-catalog-item';
import { useDeleteSubscription, useSubscriptions } from '../../api/v1/maas-subscription';
import type { Subscription, SubscriptionState } from '../../api/v1/maas-types';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';

const SubscriptionStateLabel = ({ state }: { state: SubscriptionState | undefined }) => {
  const { t } = useTranslation();
  if (state === 'SUSPENDED') {
    return (
      <Label isCompact color="grey">
        {t('Suspended')}
      </Label>
    );
  }
  return (
    <Label isCompact color="green">
      {t('Active')}
    </Label>
  );
};

export const AdminMaaSSubscriptionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const { data: subscriptions = [], isLoading, error } = useSubscriptions();
  const { data: catalogItems = [] } = useMaaSCatalogItems({}, tenantId);
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const [toDelete, setToDelete] = useState<Subscription | null>(null);
  const [search, setSearch] = useState('');

  const catalogItemById = useMemo(
    () => new Map(catalogItems.map((c) => [c.id, c])),
    [catalogItems],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return subscriptions;
    }
    return subscriptions.filter((s) => {
      const name = (s.metadata?.name ?? s.id).toLowerCase();
      const model = (
        catalogItemById.get(s.spec?.modelCatalogItemId ?? '')?.title ?? ''
      ).toLowerCase();
      return name.includes(q) || model.includes(q);
    });
  }, [subscriptions, search, catalogItemById]);

  return (
    <ListPage
      title={t('AI Subscriptions')}
      description={t(
        'Configure per-model subscriptions: group access (Authorino), rate limits and quotas (Limiter), and the tenant IDP used for authentication.',
      )}
      actions={
        <Button variant="primary" onClick={() => navigate('/admin/ai-subscriptions/new')}>
          {t('Create subscription')}
        </Button>
      }
    >
      {toDelete && (
        <Alert
          variant="warning"
          isInline
          title={t('Delete subscription "{{name}}"?', {
            name: toDelete.metadata?.name ?? toDelete.id,
          })}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  deleteSubscription(toDelete.id);
                  setToDelete(null);
                }}
              >
                {t('Delete')}
              </Button>
              <Button variant="link" onClick={() => setToDelete(null)}>
                {t('Cancel')}
              </Button>
            </>
          }
        />
      )}
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                aria-label={t('Search subscriptions')}
                placeholder={t('Search by name or model')}
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {subscriptions.length === 0 ? (
          <EmptyState titleText={t('No subscriptions yet')} headingLevel="h2">
            <EmptyStateBody>
              {t(
                'Create a subscription to govern which groups can access a model, at what rate, and under what token quota.',
              )}
            </EmptyStateBody>
            <EmptyStateFooter>
              <Button variant="primary" onClick={() => navigate('/admin/ai-subscriptions/new')}>
                {t('Create subscription')}
              </Button>
            </EmptyStateFooter>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>{t('No subscriptions match the current search.')}</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={() => setSearch('')}>
                {t('Clear search')}
              </Button>
            </FlexItem>
          </Flex>
        ) : (
          <Table aria-label={t('Subscriptions')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Model')}</Th>
                <Th>{t('Groups')}</Th>
                <Th>{t('Rate limit')}</Th>
                <Th>{t('Token quota')}</Th>
                <Th>{t('State')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((sub) => {
                const model = catalogItemById.get(sub.spec?.modelCatalogItemId ?? '');
                return (
                  <Tr key={sub.id}>
                    <Td dataLabel={t('Name')}>{sub.metadata?.name ?? sub.id}</Td>
                    <Td dataLabel={t('Model')}>
                      {model?.title ?? sub.spec?.modelCatalogItemId ?? '—'}
                    </Td>
                    <Td dataLabel={t('Groups')}>
                      {sub.spec?.groupAccess?.length
                        ? sub.spec.groupAccess.map((g) => (
                            <Label key={g} isCompact style={{ marginRight: 4 }}>
                              {g}
                            </Label>
                          ))
                        : '—'}
                    </Td>
                    <Td dataLabel={t('Rate limit')}>
                      {sub.spec?.rateLimit
                        ? t('{{rate}} req/min', { rate: sub.spec.rateLimit })
                        : '—'}
                    </Td>
                    <Td dataLabel={t('Token quota')}>
                      {sub.spec?.tokenQuota
                        ? t('{{quota}}/mo', { quota: sub.spec.tokenQuota.toLocaleString() })
                        : '—'}
                    </Td>
                    <Td dataLabel={t('State')}>
                      <SubscriptionStateLabel state={sub.status?.state} />
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: t('Edit'),
                            onClick: () => navigate(`/admin/ai-subscriptions/${sub.id}/edit`),
                          },
                          { title: t('Delete'), onClick: () => setToDelete(sub), isDanger: true },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};

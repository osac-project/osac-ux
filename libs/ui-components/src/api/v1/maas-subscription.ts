/**
 * @temp-api — Subscription hooks (OSAC-MaaS)
 *
 * These hooks front the predicted v1/subscriptions API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * A Subscription is the Tenant Admin's governance unit for MaaS access:
 * group access (Authorino), rate limits (Limiter), and token quotas.
 *
 * Future migration:
 *  - Replace Subscription / SubscriptionsListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import type { Subscription, SubscriptionsListResponse } from './maas-types';

const invalidateSubscriptions = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/subscriptions', null) });
};

export const useSubscriptions = () =>
  useApiQuery<SubscriptionsListResponse, Subscription[]>({
    queryKey: ['v1/subscriptions', null],
    select: (data) => data.items,
  });

export const useSubscription = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<Subscription>({
    queryKey: ['v1/subscriptions', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const useCreateSubscription = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Subscription, 'id'>) =>
      apiFetch<Subscription>('v1/subscriptions', { method: 'POST', body }),
    onSuccess: () => invalidateSubscriptions(qc),
    retry: false,
  });
};

export const usePatchSubscription = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Subscription> }) =>
      apiFetch<Subscription>('v1/subscriptions', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateSubscriptions(qc),
    retry: false,
  });
};

export const useDeleteSubscription = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/subscriptions', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateSubscriptions(qc),
    retry: false,
  });
};

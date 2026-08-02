/**
 * @temp-api — Price Plan hooks (REQ-BA-4)
 *
 * These hooks front the predicted v1/price_plans API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * A PricePlan groups rate overrides (per BillableComponent meterKey) that a
 * billing-admin-capable CSP Admin can assign to a tenant via price_plan_ref.
 * In the real architecture this maps to a Koku Cost Model (see BillingArchDiagram).
 *
 * Future migration:
 *  - Replace PricePlan / PricePlansListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import type { PricePlan, PricePlansListResponse } from './billing-types';

const invalidatePricePlans = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/price_plans', null) });
};

export const usePricePlans = () =>
  useApiQuery<PricePlansListResponse, PricePlan[]>({
    queryKey: ['v1/price_plans', null],
    select: (data) => data.items,
  });

export const usePricePlan = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<PricePlan>({
    queryKey: ['v1/price_plans', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const useCreatePricePlan = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<PricePlan, 'id'>) =>
      apiFetch<PricePlan>('v1/price_plans', { method: 'POST', body }),
    onSuccess: () => invalidatePricePlans(qc),
    retry: false,
  });
};

export const usePatchPricePlan = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PricePlan> }) =>
      apiFetch<PricePlan>('v1/price_plans', { pathParams: [id], method: 'PATCH', body: patch }),
    onSuccess: () => invalidatePricePlans(qc),
    retry: false,
  });
};

export const useDeletePricePlan = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/price_plans', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidatePricePlans(qc),
    retry: false,
  });
};

export type { PricePlan };

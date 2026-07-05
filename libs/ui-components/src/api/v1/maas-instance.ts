/**
 * @temp-api — Model Access hooks (OSAC-MaaS)
 *
 * These hooks front the predicted v1/model_accesses API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * Future migration:
 *  - Replace ModelAccess / ModelAccessesListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import type { ModelAccess, ModelAccessesListResponse } from './maas-types';

const invalidateModelAccesses = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/model_accesses', null) });
};

export const useModelAccesses = () =>
  useApiQuery<ModelAccessesListResponse, ModelAccess[]>({
    queryKey: ['v1/model_accesses', null],
    select: (data) => data.items,
  });

export const useModelAccess = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ModelAccess>({
    queryKey: ['v1/model_accesses', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const useProvisionModelAccess = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ModelAccess, 'id'>) =>
      apiFetch<ModelAccess>('v1/model_accesses', { method: 'POST', body }),
    onSuccess: () => invalidateModelAccesses(qc),
    retry: false,
  });
};

export const useRevokeModelAccess = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ModelAccess>('v1/model_accesses', {
        pathParams: [id],
        method: 'PATCH',
        body: { status: { state: 'REVOKED' } },
      }),
    onSuccess: () => invalidateModelAccesses(qc),
    retry: false,
  });
};

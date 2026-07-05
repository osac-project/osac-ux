/**
 * @temp-api — AI Environment hooks (OSAC-MaaS)
 *
 * These hooks front the predicted v1/ai_environments API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * Future migration:
 *  - Replace AiEnvironment / AiEnvironmentsListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import type { AiEnvironment, AiEnvironmentsListResponse } from './maas-types';

const invalidateAiEnvironments = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/ai_environments', null) });
};

export const useAiEnvironments = () =>
  useApiQuery<AiEnvironmentsListResponse, AiEnvironment[]>({
    queryKey: ['v1/ai_environments', null],
    select: (data) => data.items,
  });

export const useAiEnvironment = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<AiEnvironment>({
    queryKey: ['v1/ai_environments', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

/** PATCH v1/ai_environments/:id — e.g. to set price_per_hour label */
export const usePatchAiEnvironment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AiEnvironment> }) =>
      apiFetch<AiEnvironment>('v1/ai_environments', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateAiEnvironments(qc),
    retry: false,
  });
};
export const useEnableAiEnvironment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AiEnvironment, 'id'>) =>
      apiFetch<AiEnvironment>('v1/ai_environments', { method: 'POST', body }),
    onSuccess: () => invalidateAiEnvironments(qc),
    retry: false,
  });
};

// @temp-api — no fulfillment-service proto yet; backed by mock store in demo mode
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface StorageTier {
  id: string;
  metadata?: {
    name: string;
    description?: string;
    creationTimestamp?: string;
    /**
     * price_per_gib_month — cost in USD per GiB per month (CoP billing dimension).
     * Set by providerAdmin via metadata labels.
     */
    labels?: Record<string, string>;
  };
  spec: {
    displayName?: string;
    protocol: string;
    qosClass: string;
    storageClassName: string;
    storageBackend?: string;
  };
  status: {
    available: boolean;
  };
}

interface StorageTiersListResponse {
  items: StorageTier[];
}

export const invalidateStorageTiers = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/storage_tiers', null) });
};

export const useStorageTiers = () =>
  useApiQuery<StorageTiersListResponse, StorageTier[]>({
    queryKey: ['v1/storage_tiers'],
    select: (data: StorageTiersListResponse) => data.items,
  });

export const useCreateStorageTier = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<StorageTier, 'id'>) =>
      apiFetch<StorageTier>('v1/storage_tiers', { method: 'POST', body }),
    onSuccess: () => invalidateStorageTiers(qc),
    retry: false,
  });
};

export const usePatchStorageTier = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<StorageTier> }) =>
      apiFetch<StorageTier>('v1/storage_tiers', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateStorageTiers(qc),
    retry: false,
  });
};

export const useDeleteStorageTier = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/storage_tiers', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateStorageTiers(qc),
    retry: false,
  });
};

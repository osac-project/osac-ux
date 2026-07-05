// @temp-api — private provider endpoint, no public proto generated
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface StorageBackend {
  id: string;
  metadata?: { name: string; creationTimestamp?: string; description?: string };
  spec: {
    provider: 'ceph' | 'nfs' | 's3';
    endpoint: string;
    description?: string;
    credentials?: { username: string; password?: string };
  };
  status: { state: 'PENDING' | 'READY' | 'FAILED'; message?: string };
}

interface StorageBackendsListResponse {
  items: StorageBackend[];
}

export const invalidateStorageBackends = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/storage_backends', null) });
};

export const useStorageBackends = () =>
  useApiQuery<StorageBackendsListResponse, StorageBackend[]>({
    queryKey: ['v1/storage_backends'],
    select: (data: StorageBackendsListResponse) => data.items,
  });

export const useRegisterStorageBackend = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<StorageBackend, 'id' | 'status'>) =>
      apiFetch<StorageBackend>('v1/storage_backends', { method: 'POST', body }),
    onSuccess: () => invalidateStorageBackends(qc),
    retry: false,
  });
};

export const usePatchStorageBackend = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<StorageBackend, 'metadata' | 'spec'>>;
    }) =>
      apiFetch<StorageBackend>('v1/storage_backends', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateStorageBackends(qc),
    retry: false,
  });
};

export const useDeleteStorageBackend = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/storage_backends', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateStorageBackends(qc),
    retry: false,
  });
};

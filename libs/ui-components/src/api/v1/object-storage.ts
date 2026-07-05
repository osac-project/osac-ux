// @temp-api — replace with proto-generated once fulfillment-service adds v1/object_storage_buckets
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface ObjectStorageBucket {
  id: string;
  metadata?: {
    name: string;
    creationTimestamp?: string;
    creator?: string;
  };
  spec: {
    quotaGib?: number;
    versioning?: boolean;
    description?: string;
  };
  status: {
    state: 'PROVISIONING' | 'READY' | 'DELETING' | 'FAILED';
    endpoint?: string;
    usedGib?: number;
    objectCount?: number;
  };
}

export interface ObjectStorageBucketsListResponse {
  items: ObjectStorageBucket[];
  total: number;
}

export const useObjectStorageBuckets = () =>
  useApiQuery<ObjectStorageBucketsListResponse, ObjectStorageBucket[]>({
    queryKey: ['v1/object_storage_buckets'],
    select: (data: ObjectStorageBucketsListResponse) => data.items,
  });

export const useObjectStorageBucket = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ObjectStorageBucket>({
    queryKey: ['v1/object_storage_buckets', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const invalidateBucketQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/object_storage_buckets') });
};

export const useCreateObjectStorageBucket = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      quotaGib?: number;
      versioning?: boolean;
      description?: string;
    }) =>
      apiFetch<ObjectStorageBucket>('v1/object_storage_buckets', {
        method: 'POST',
        body,
      }),
    onSuccess: () => invalidateBucketQueries(qc),
    retry: false,
  });
};

export const useUpdateObjectStorageBucket = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ObjectStorageBucket['spec']> }) =>
      apiFetch<ObjectStorageBucket>('v1/object_storage_buckets', {
        pathParams: [id],
        method: 'PATCH',
        body: { spec: patch },
      }),
    onSuccess: () => invalidateBucketQueries(qc),
    retry: false,
  });
};

export const useDeleteObjectStorageBucket = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/object_storage_buckets', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateBucketQueries(qc),
    retry: false,
  });
};

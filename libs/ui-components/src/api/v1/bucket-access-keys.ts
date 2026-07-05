// @temp-api — replace with proto-generated once fulfillment-service adds v1/bucket_access_keys
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface BucketAccessKey {
  id: string;
  metadata?: {
    name: string;
    creationTimestamp?: string;
    creator?: string;
  };
  spec: {
    bucketId: string;
    description?: string;
  };
  status: {
    state: 'ACTIVE' | 'REVOKING';
    accessKeyId: string;
    secretAccessKey?: string; // only present on create response
  };
}

export interface BucketAccessKeysListResponse {
  items: BucketAccessKey[];
  total: number;
}

export const useBucketAccessKeys = (bucketId: string) =>
  useApiQuery<BucketAccessKeysListResponse, BucketAccessKey[]>({
    queryKey: ['v1/bucket_access_keys', null, { bucketId }],
    select: (data: BucketAccessKeysListResponse) => data.items,
    enabled: Boolean(bucketId),
  });

export const invalidateBucketAccessKeyQueries = async (
  qc: ReturnType<typeof useApiQueryClient>,
  bucketId?: string,
) => {
  await qc.invalidateQueries({
    queryKey: apiQueryKey('v1/bucket_access_keys', null, bucketId ? { bucketId } : undefined),
  });
};

export const useCreateBucketAccessKey = (bucketId: string) => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      apiFetch<BucketAccessKey>('v1/bucket_access_keys', {
        method: 'POST',
        body: { ...body, bucketId },
      }),
    onSuccess: () => invalidateBucketAccessKeyQueries(qc, bucketId),
    retry: false,
  });
};

export const useDeleteBucketAccessKey = (bucketId: string) => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      apiFetch<void>('v1/bucket_access_keys', {
        pathParams: [keyId],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateBucketAccessKeyQueries(qc, bucketId),
    retry: false,
  });
};

import { useMutation } from '@tanstack/react-query';

import {
  type Cluster,
  ClusterSchema,
  type ClustersListResponse,
  ClustersListResponseSchema,
} from '@osac/types';

export type CreateClusterInput = {
  metadata: { name: string };
  spec: {
    catalogItem: string;
    sshPublicKey?: string;
    pullSecret?: string;
    templateParameters?: Record<string, unknown>;
  };
};

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListClustersParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusters = (params: ListClustersParams = {}) =>
  useApiQuery<ClustersListResponse, Cluster[]>({
    queryKey: ['v1/clusters', null, params],
    select: (data: ClustersListResponse) => data.items,
    meta: { decode: ClustersListResponseSchema },
  });

export const useCluster = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<Cluster>({
    queryKey: ['v1/clusters', [trimmedId]],
    meta: { decode: ClusterSchema },
    enabled: Boolean(trimmedId),
  });
};

export const invalidateClustersQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/clusters', null) });
};

export const useCreateCluster = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: CreateClusterInput) =>
      apiFetch<Cluster>('v1/clusters', {
        method: 'POST',
        body,
        decode: ClusterSchema,
      }),
    onSuccess: () => invalidateClustersQueries(qc),
    retry: false,
  });
};

export const useDeleteCluster = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/clusters', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateClustersQueries(qc),
    retry: false,
  });
};

const FULFILLMENT_API_BASE = '/api/fulfillment';

export const useDownloadClusterKubeconfig = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const res = await window.fetch(`${FULFILLMENT_API_BASE}/v1/clusters/${id}/kubeconfig`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to download kubeconfig: ${res.status} ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kubeconfig-${id}.yaml`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
  });

export const useGetClusterPassword = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const res = await window.fetch(`${FULFILLMENT_API_BASE}/v1/clusters/${id}/password`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to retrieve password: ${res.status} ${res.statusText}`);
      }
      return res.text();
    },
  });

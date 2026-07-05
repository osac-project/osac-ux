import { useMutation } from '@tanstack/react-query';

import {
  type ClusterCatalogItem,
  ClusterCatalogItemSchema,
  type ClusterCatalogItemsListResponse,
  ClusterCatalogItemsListResponseSchema,
} from '@osac/types';

import type { CatalogItemForDisplay } from '../../components/catalog/catalogItemDisplay';
import { catalogItemIsAllowed } from '../../components/catalog/catalogItemDisplay';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListClusterCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusterCatalogItems = (params: ListClusterCatalogItemsParams = {}, tenantId = '') =>
  useApiQuery<ClusterCatalogItemsListResponse, ClusterCatalogItem[]>({
    queryKey: ['v1/cluster_catalog_items', null, params],
    select: (data) =>
      data.items.filter(
        (item) =>
          item.published &&
          catalogItemIsAllowed(item as unknown as CatalogItemForDisplay, tenantId),
      ),
    meta: { decode: ClusterCatalogItemsListResponseSchema },
  });

export const useClusterCatalogItem = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ClusterCatalogItem>({
    queryKey: ['v1/cluster_catalog_items', trimmedId ? [trimmedId] : null],
    meta: { decode: ClusterCatalogItemSchema },
    enabled: Boolean(trimmedId),
  });
};

export const useAllClusterCatalogItems = (params: ListClusterCatalogItemsParams = {}) =>
  useApiQuery<ClusterCatalogItemsListResponse, ClusterCatalogItem[]>({
    queryKey: ['v1/cluster_catalog_items', null, params],
    select: (data) => data.items,
    meta: { decode: ClusterCatalogItemsListResponseSchema },
  });

const invalidateClusterCatalogItemsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/cluster_catalog_items', null) });
};

export const useCreateClusterCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ClusterCatalogItem, 'id'>) =>
      apiFetch<ClusterCatalogItem>('v1/cluster_catalog_items', {
        method: 'POST',
        body,
        decode: ClusterCatalogItemSchema,
      }),
    onSuccess: () => invalidateClusterCatalogItemsQueries(qc),
    retry: false,
  });
};

export const usePatchClusterCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ClusterCatalogItem> }) =>
      apiFetch<ClusterCatalogItem>('v1/cluster_catalog_items', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: ClusterCatalogItemSchema,
      }),
    onSuccess: () => invalidateClusterCatalogItemsQueries(qc),
    retry: false,
  });
};

export const useDeleteClusterCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/cluster_catalog_items', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateClusterCatalogItemsQueries(qc),
    retry: false,
  });
};

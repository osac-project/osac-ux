import { useMutation } from '@tanstack/react-query';

import {
  type ComputeInstanceCatalogItem,
  ComputeInstanceCatalogItemSchema,
  type ComputeInstanceCatalogItemsListResponse,
  ComputeInstanceCatalogItemsListResponseSchema,
} from '@osac/types';

import type { CatalogItemForDisplay } from '../../components/catalog/catalogItemDisplay';
import { catalogItemIsAllowed } from '../../components/catalog/catalogItemDisplay';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListComputeInstanceCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstanceCatalogItems = (
  params: ListComputeInstanceCatalogItemsParams = {},
  tenantId = '',
) =>
  useApiQuery<ComputeInstanceCatalogItemsListResponse, ComputeInstanceCatalogItem[]>({
    queryKey: ['v1/compute_instance_catalog_items', null, params],
    select: (data) =>
      data.items.filter(
        (item) =>
          item.published &&
          catalogItemIsAllowed(item as unknown as CatalogItemForDisplay, tenantId),
      ),
    meta: { decode: ComputeInstanceCatalogItemsListResponseSchema },
  });

export const useComputeInstanceCatalogItem = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ComputeInstanceCatalogItem>({
    queryKey: ['v1/compute_instance_catalog_items', trimmedId ? [trimmedId] : null],
    meta: { decode: ComputeInstanceCatalogItemSchema },
    enabled: Boolean(trimmedId),
  });
};

export const useAllComputeInstanceCatalogItems = (
  params: ListComputeInstanceCatalogItemsParams = {},
) =>
  useApiQuery<ComputeInstanceCatalogItemsListResponse, ComputeInstanceCatalogItem[]>({
    queryKey: ['v1/compute_instance_catalog_items', null, params],
    select: (data) => data.items,
    meta: { decode: ComputeInstanceCatalogItemsListResponseSchema },
  });

const invalidateCatalogItemsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({
    queryKey: apiQueryKey('v1/compute_instance_catalog_items', null),
  });
};

export const useCreateComputeInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ComputeInstanceCatalogItem, 'id'>) =>
      apiFetch<ComputeInstanceCatalogItem>('v1/compute_instance_catalog_items', {
        method: 'POST',
        body,
        decode: ComputeInstanceCatalogItemSchema,
      }),
    onSuccess: () => invalidateCatalogItemsQueries(qc),
    retry: false,
  });
};

export const usePatchComputeInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ComputeInstanceCatalogItem> }) =>
      apiFetch<ComputeInstanceCatalogItem>('v1/compute_instance_catalog_items', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: ComputeInstanceCatalogItemSchema,
      }),
    onSuccess: () => invalidateCatalogItemsQueries(qc),
    retry: false,
  });
};

export const useDeleteComputeInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/compute_instance_catalog_items', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateCatalogItemsQueries(qc),
    retry: false,
  });
};

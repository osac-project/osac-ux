/**
 * @temp-api — MaaS Catalog Item hooks (OSAC-MaaS)
 *
 * These hooks front the predicted v1/model_catalog_items API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * Future migration:
 *  - Replace ModelCatalogItem / ModelCatalogItemsListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useMutation } from '@tanstack/react-query';

import type { CatalogItemForDisplay } from '../../components/catalog/catalogItemDisplay';
import { catalogItemIsAllowed } from '../../components/catalog/catalogItemDisplay';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import type { ModelCatalogItem, ModelCatalogItemsListResponse } from './maas-types';

export type ListMaaSCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

const invalidateMaaSCatalogItems = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/model_catalog_items', null) });
};

/** Tenant-visible: published items filtered by allowed_tenants */
export const useMaaSCatalogItems = (params: ListMaaSCatalogItemsParams = {}, tenantId = '') =>
  useApiQuery<ModelCatalogItemsListResponse, ModelCatalogItem[]>({
    queryKey: ['v1/model_catalog_items', null, params],
    select: (data) =>
      data.items.filter(
        (i) => i.published && catalogItemIsAllowed(i as unknown as CatalogItemForDisplay, tenantId),
      ),
  });

/** Provider-admin: all items including unpublished */
export const useAllMaaSCatalogItems = (params: ListMaaSCatalogItemsParams = {}) =>
  useApiQuery<ModelCatalogItemsListResponse, ModelCatalogItem[]>({
    queryKey: ['v1/model_catalog_items', null, params],
    select: (data) => data.items,
  });

export const useMaaSCatalogItem = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ModelCatalogItem>({
    queryKey: ['v1/model_catalog_items', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const useCreateMaaSCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ModelCatalogItem, 'id'>) =>
      apiFetch<ModelCatalogItem>('v1/model_catalog_items', { method: 'POST', body }),
    onSuccess: () => invalidateMaaSCatalogItems(qc),
    retry: false,
  });
};

export const usePatchMaaSCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ModelCatalogItem> }) =>
      apiFetch<ModelCatalogItem>('v1/model_catalog_items', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateMaaSCatalogItems(qc),
    retry: false,
  });
};

export const useDeleteMaaSCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/model_catalog_items', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateMaaSCatalogItems(qc),
    retry: false,
  });
};

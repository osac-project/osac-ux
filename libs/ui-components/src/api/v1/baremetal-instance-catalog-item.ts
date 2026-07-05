import { useMutation } from '@tanstack/react-query';

import {
  type BareMetalInstanceCatalogItem,
  BareMetalInstanceCatalogItemSchema,
  type BareMetalInstanceCatalogItemsListResponse,
  BareMetalInstanceCatalogItemsListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListBareMetalInstanceCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useAllBareMetalInstanceCatalogItems = (
  params: ListBareMetalInstanceCatalogItemsParams = {},
) =>
  useApiQuery<BareMetalInstanceCatalogItemsListResponse, BareMetalInstanceCatalogItem[]>({
    queryKey: ['v1/baremetal_instance_catalog_items', null, params],
    select: (data) => data.items,
    meta: { decode: BareMetalInstanceCatalogItemsListResponseSchema },
  });

const invalidateBmCatalogItemsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({
    queryKey: apiQueryKey('v1/baremetal_instance_catalog_items', null),
  });
};

export const useCreateBareMetalInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<BareMetalInstanceCatalogItem, 'id'>) =>
      apiFetch<BareMetalInstanceCatalogItem>('v1/baremetal_instance_catalog_items', {
        method: 'POST',
        body,
        decode: BareMetalInstanceCatalogItemSchema,
      }),
    onSuccess: () => invalidateBmCatalogItemsQueries(qc),
    retry: false,
  });
};

export const usePatchBareMetalInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BareMetalInstanceCatalogItem> }) =>
      apiFetch<BareMetalInstanceCatalogItem>('v1/baremetal_instance_catalog_items', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: BareMetalInstanceCatalogItemSchema,
      }),
    onSuccess: () => invalidateBmCatalogItemsQueries(qc),
    retry: false,
  });
};

export const useDeleteBareMetalInstanceCatalogItem = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/baremetal_instance_catalog_items', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateBmCatalogItemsQueries(qc),
    retry: false,
  });
};

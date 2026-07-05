import { useMutation } from '@tanstack/react-query';

import {
  type BareMetalInstance,
  type BareMetalInstanceCatalogItem,
  BareMetalInstanceCatalogItemSchema,
  type BareMetalInstanceCatalogItemsListResponse,
  BareMetalInstanceCatalogItemsListResponseSchema,
  BareMetalInstanceSchema,
  type BareMetalInstancesListResponse,
  BareMetalInstancesListResponseSchema,
} from '@osac/types';

import type { CatalogItemForDisplay } from '../../components/catalog/catalogItemDisplay';
import { catalogItemIsAllowed } from '../../components/catalog/catalogItemDisplay';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useBareMetalInstances = () =>
  useApiQuery<BareMetalInstancesListResponse, BareMetalInstance[]>({
    queryKey: ['v1/baremetal_instances', null],
    select: (data) => data.items,
    meta: { decode: BareMetalInstancesListResponseSchema },
  });

export const useBareMetalInstance = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<BareMetalInstance>({
    queryKey: ['v1/baremetal_instances', [trimmedId]],
    meta: { decode: BareMetalInstanceSchema },
    enabled: Boolean(trimmedId),
  });
};

const invalidateBareMetalInstances = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/baremetal_instances', null) });
};

export const useDeleteBareMetalInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/baremetal_instances', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateBareMetalInstances(qc),
  });
};

export const usePatchBareMetalInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BareMetalInstance> }) =>
      apiFetch<BareMetalInstance>('v1/baremetal_instances', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: BareMetalInstanceSchema,
      }),
    onSuccess: () => invalidateBareMetalInstances(qc),
  });
};

export type ListBareMetalInstanceCatalogItemsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useBareMetalInstanceCatalogItems = (
  params: ListBareMetalInstanceCatalogItemsParams = {},
  tenantId = '',
) =>
  useApiQuery<BareMetalInstanceCatalogItemsListResponse, BareMetalInstanceCatalogItem[]>({
    queryKey: ['v1/baremetal_instance_catalog_items', null, params],
    select: (data) =>
      data.items.filter(
        (i) => i.published && catalogItemIsAllowed(i as unknown as CatalogItemForDisplay, tenantId),
      ),
    meta: { decode: BareMetalInstanceCatalogItemsListResponseSchema },
  });

export const useCreateBareMetalInstance = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      metadata: { name: string };
      spec: {
        catalogItem: string;
        sshPublicKey?: string;
        userData?: string;
        runStrategy?: number;
      };
    }) =>
      apiFetch<BareMetalInstance>('v1/baremetal_instances', {
        method: 'POST',
        body,
        decode: BareMetalInstanceSchema,
      }),
    onSuccess: () => invalidateBareMetalInstances(qc),
    retry: false,
  });
};

export const useBareMetalInstanceCatalogItem = (id?: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<BareMetalInstanceCatalogItem>({
    queryKey: ['v1/baremetal_instance_catalog_items', [trimmedId]],
    meta: { decode: BareMetalInstanceCatalogItemSchema },
    enabled: Boolean(trimmedId),
  });
};

export type { BareMetalInstance, BareMetalInstanceCatalogItem };

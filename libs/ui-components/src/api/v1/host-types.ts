import { useMutation } from '@tanstack/react-query';

import {
  type HostType,
  HostTypeSchema,
  type HostTypesListResponse,
  HostTypesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import { resourceDisplayName } from './networking';

export type ListHostTypesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

export const useHostTypes = (params: ListHostTypesParams = {}) =>
  useApiQuery<HostTypesListResponse, HostType[]>({
    queryKey: ['v1/host_types', null, params],
    select: (data) => data.items,
    meta: { decode: HostTypesListResponseSchema },
  });

export const useHostType = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<HostType>({
    queryKey: ['v1/host_types', [trimmedId]],
    meta: { decode: HostTypeSchema },
    enabled: Boolean(trimmedId),
  });
};

const invalidateHostTypesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/host_types', null) });
};

export const useCreateHostType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<HostType, 'id'>) =>
      apiFetch<HostType>('v1/host_types', {
        method: 'POST',
        body,
        decode: HostTypeSchema,
      }),
    onSuccess: () => invalidateHostTypesQueries(qc),
    retry: false,
  });
};

export const usePatchHostType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<HostType> }) =>
      apiFetch<HostType>('v1/host_types', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: HostTypeSchema,
      }),
    onSuccess: () => invalidateHostTypesQueries(qc),
    retry: false,
  });
};

export const useDeleteHostType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/host_types', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateHostTypesQueries(qc),
    retry: false,
  });
};

export const hostTypeName = (hostType: HostType): string =>
  resourceDisplayName(hostType.metadata, hostType.id);

export const isGpuHostType = (hostType: HostType): boolean =>
  hostType.metadata?.labels?.['gpu'] === 'true';

export const hostTypePricePerHour = (hostType: HostType): number | null => {
  const raw = hostType.metadata?.labels?.['price_per_hour'];
  if (!raw) {
    return null;
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
};

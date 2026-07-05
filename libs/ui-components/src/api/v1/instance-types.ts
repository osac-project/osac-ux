import { useMutation } from '@tanstack/react-query';

import {
  type InstanceType,
  InstanceTypeSchema,
  InstanceTypeState,
  type InstanceTypesListResponse,
  InstanceTypesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import { resourceDisplayName } from './networking';

export type ListInstanceTypesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type InstanceTypesQueryOptions = {
  enabled?: boolean;
};

export const useInstanceTypes = (
  params: ListInstanceTypesParams = {},
  options: InstanceTypesQueryOptions = {},
) =>
  useApiQuery<InstanceTypesListResponse, InstanceType[]>({
    queryKey: ['v1/instance_types', null, params],
    select: (data) => data.items.filter((item) => !isObsoleteInstanceType(item)),
    meta: { decode: InstanceTypesListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const isObsoleteInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.OBSOLETE;

export const isDeprecatedInstanceType = (instanceType: InstanceType): boolean =>
  instanceType.spec?.state === InstanceTypeState.DEPRECATED;

export const instanceTypeName = (instanceType: InstanceType): string =>
  resourceDisplayName(instanceType.metadata, instanceType.id);

export const formatInstanceTypeSizing = (instanceType: InstanceType): string => {
  const cores = instanceType.spec?.cores;
  const memoryGib = instanceType.spec?.memoryGib;
  if (cores == null || memoryGib == null) {
    return '—';
  }
  return `${cores} vCPU, ${memoryGib} GiB`;
};

export const formatInstanceTypeOptionLabel = (
  instanceType: InstanceType,
  deprecatedSuffix = ' (deprecated)',
): string => {
  const name = instanceTypeName(instanceType);
  const sizing = formatInstanceTypeSizing(instanceType);
  const deprecated = isDeprecatedInstanceType(instanceType) ? deprecatedSuffix : '';
  return `${name} — ${sizing}${deprecated}`;
};

export const formatInstanceTypeReviewLabel = (
  instanceTypeId: string,
  instanceTypes: InstanceType[],
  deprecatedSuffix = ' (deprecated)',
): string => {
  const instanceType = instanceTypes.find((item) => item.id === instanceTypeId);
  if (!instanceType) {
    return instanceTypeId || '—';
  }
  return formatInstanceTypeOptionLabel(instanceType, deprecatedSuffix);
};

export const instanceTypePricePerHour = (instanceType: InstanceType): number | null => {
  const raw = instanceType.metadata?.labels?.['price_per_hour'];
  if (!raw) {
    return null;
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
};

const invalidateInstanceTypesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/instance_types', null) });
};

export const useCreateInstanceType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<InstanceType, 'id'>) =>
      apiFetch<InstanceType>('v1/instance_types', {
        method: 'POST',
        body,
        decode: InstanceTypeSchema,
      }),
    onSuccess: () => invalidateInstanceTypesQueries(qc),
    retry: false,
  });
};

export const usePatchInstanceType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<InstanceType> }) =>
      apiFetch<InstanceType>('v1/instance_types', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: InstanceTypeSchema,
      }),
    onSuccess: () => invalidateInstanceTypesQueries(qc),
    retry: false,
  });
};

export const useDeleteInstanceType = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/instance_types', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateInstanceTypesQueries(qc),
    retry: false,
  });
};

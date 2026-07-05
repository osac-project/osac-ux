import { useMutation } from '@tanstack/react-query';

import {
  type Tenant,
  TenantSchema,
  type TenantsListResponse,
  TenantsListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useTenants = () =>
  useApiQuery<TenantsListResponse, Tenant[]>({
    queryKey: ['v1/tenants'],
    select: (data: TenantsListResponse) => data.items,
    meta: { decode: TenantsListResponseSchema },
  });

export const useTenant = (id: string) =>
  useApiQuery<Tenant>({
    queryKey: ['v1/tenants', [id]],
    meta: { decode: TenantSchema },
    enabled: Boolean(id),
  });

const invalidate = async (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/tenants') });

export const useCreateTenant = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { metadata: { name: string }; spec: { domains: string[] } }) =>
      apiFetch<Tenant>('v1/tenants', { method: 'POST', body }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

export const useDeleteTenant = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/tenants', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

export const usePatchTenant = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { spec: { domains: string[] } } }) =>
      apiFetch<Tenant>('v1/tenants', { pathParams: [id], method: 'PATCH', body: patch }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

export type { Tenant };

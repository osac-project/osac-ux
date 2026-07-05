import { useMutation } from '@tanstack/react-query';

import {
  type Role,
  type RoleBinding,
  RoleBindingSchema,
  type RoleBindingsListResponse,
  RoleBindingsListResponseSchema,
  RoleSchema,
  type RolesListResponse,
  RolesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useRoles = () =>
  useApiQuery<RolesListResponse, Role[]>({
    queryKey: ['v1/roles'],
    select: (data: RolesListResponse) => data.items,
    meta: { decode: RolesListResponseSchema },
  });

export const useRoleBindings = () =>
  useApiQuery<RoleBindingsListResponse, RoleBinding[]>({
    queryKey: ['v1/role_bindings'],
    select: (data: RoleBindingsListResponse) => data.items,
    meta: { decode: RoleBindingsListResponseSchema },
  });

export const useRoleBinding = (id: string) =>
  useApiQuery<RoleBinding>({
    queryKey: ['v1/role_bindings', [id]],
    meta: { decode: RoleBindingSchema },
    enabled: Boolean(id),
  });

const invalidateBindings = async (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/role_bindings') });

export const useCreateRoleBinding = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { spec: { role: string; users: string[] } }) =>
      apiFetch<RoleBinding>('v1/role_bindings', { method: 'POST', body }),
    onSuccess: () => invalidateBindings(qc),
    retry: false,
  });
};

export const usePatchRoleBinding = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { spec: { users: string[] } } }) =>
      apiFetch<RoleBinding>('v1/role_bindings', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: RoleBindingSchema,
      }),
    onSuccess: () => invalidateBindings(qc),
    retry: false,
  });
};

export const useDeleteRoleBinding = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/role_bindings', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateBindings(qc),
    retry: false,
  });
};

export type { Role, RoleBinding };

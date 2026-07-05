import { useMutation } from '@tanstack/react-query';

import {
  type IdentityProvider,
  IdentityProviderSchema,
  type IdentityProvidersListResponse,
  IdentityProvidersListResponseSchema,
  type OidcConfig,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export const useIdentityProviders = () =>
  useApiQuery<IdentityProvidersListResponse, IdentityProvider[]>({
    queryKey: ['v1/identity_providers'],
    select: (data: IdentityProvidersListResponse) => data.items,
    meta: { decode: IdentityProvidersListResponseSchema },
  });

export const useIdentityProvider = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<IdentityProvider>({
    queryKey: ['v1/identity_providers', [trimmedId]],
    meta: { decode: IdentityProviderSchema },
    enabled: Boolean(trimmedId),
  });
};

export const invalidateIdentityProviderQueries = async (
  qc: ReturnType<typeof useApiQueryClient>,
) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/identity_providers') });
};

export type CreateOidcProviderBody = {
  metadata: { name: string };
  spec: {
    title: string;
    enabled: boolean;
    config: { case: 'oidc'; value: OidcConfig };
  };
};

export const useCreateIdentityProvider = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: CreateOidcProviderBody) =>
      apiFetch<IdentityProvider>('v1/identity_providers', { method: 'POST', body }),
    onSuccess: () => invalidateIdentityProviderQueries(qc),
    retry: false,
  });
};

export const useDeleteIdentityProvider = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/identity_providers', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateIdentityProviderQueries(qc),
    retry: false,
  });
};

export const usePatchIdentityProvider = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<IdentityProvider> }) =>
      apiFetch<IdentityProvider>('v1/identity_providers', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: IdentityProviderSchema,
      }),
    onSuccess: () => invalidateIdentityProviderQueries(qc),
    retry: false,
  });
};

export type { IdentityProvider, OidcConfig };

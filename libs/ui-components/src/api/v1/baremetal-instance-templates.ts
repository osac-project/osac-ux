import { useMutation } from '@tanstack/react-query';

import {
  type BareMetalInstanceTemplate,
  BareMetalInstanceTemplateSchema,
  type BareMetalInstanceTemplatesListResponse,
  BareMetalInstanceTemplatesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListBareMetalInstanceTemplatesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useBareMetalInstanceTemplates = (params: ListBareMetalInstanceTemplatesParams = {}) =>
  useApiQuery<BareMetalInstanceTemplatesListResponse, BareMetalInstanceTemplate[]>({
    queryKey: ['v1/baremetal_instance_templates', null, params],
    select: (data) => data.items,
    meta: { decode: BareMetalInstanceTemplatesListResponseSchema },
  });

export const useBareMetalInstanceTemplate = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<BareMetalInstanceTemplate>({
    queryKey: ['v1/baremetal_instance_templates', [trimmedId]],
    meta: { decode: BareMetalInstanceTemplateSchema },
    enabled: Boolean(trimmedId),
  });
};

const invalidateBmTemplatesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({
    queryKey: apiQueryKey('v1/baremetal_instance_templates', null),
  });
};

export const useCreateBareMetalInstanceTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<BareMetalInstanceTemplate, 'id'>) =>
      apiFetch<BareMetalInstanceTemplate>('v1/baremetal_instance_templates', {
        method: 'POST',
        body,
        decode: BareMetalInstanceTemplateSchema,
      }),
    onSuccess: () => invalidateBmTemplatesQueries(qc),
    retry: false,
  });
};

export const useDeleteBareMetalInstanceTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/baremetal_instance_templates', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateBmTemplatesQueries(qc),
    retry: false,
  });
};

import { useMutation } from '@tanstack/react-query';

import {
  type ComputeInstanceTemplate,
  ComputeInstanceTemplateSchema,
  type ComputeInstanceTemplatesListResponse,
  ComputeInstanceTemplatesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListComputeInstanceTemplatesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstanceTemplates = (params: ListComputeInstanceTemplatesParams = {}) =>
  useApiQuery<ComputeInstanceTemplatesListResponse, ComputeInstanceTemplate[]>({
    queryKey: ['v1/compute_instance_templates', null, params],
    select: (data) => data.items,
    meta: { decode: ComputeInstanceTemplatesListResponseSchema },
  });

export const useComputeInstanceTemplate = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ComputeInstanceTemplate>({
    queryKey: ['v1/compute_instance_templates', [trimmedId]],
    meta: { decode: ComputeInstanceTemplateSchema },
    enabled: Boolean(trimmedId),
  });
};

const invalidateTemplatesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instance_templates', null) });
};

export const useCreateComputeInstanceTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ComputeInstanceTemplate, 'id'>) =>
      apiFetch<ComputeInstanceTemplate>('v1/compute_instance_templates', {
        method: 'POST',
        body,
        decode: ComputeInstanceTemplateSchema,
      }),
    onSuccess: () => invalidateTemplatesQueries(qc),
    retry: false,
  });
};

export const usePatchComputeInstanceTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ComputeInstanceTemplate> }) =>
      apiFetch<ComputeInstanceTemplate>('v1/compute_instance_templates', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: ComputeInstanceTemplateSchema,
      }),
    onSuccess: () => invalidateTemplatesQueries(qc),
    retry: false,
  });
};

export const useDeleteComputeInstanceTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/compute_instance_templates', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateTemplatesQueries(qc),
    retry: false,
  });
};

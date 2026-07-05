import { useMutation } from '@tanstack/react-query';

import {
  type ClusterTemplate,
  ClusterTemplateSchema,
  type ClusterTemplatesListResponse,
  ClusterTemplatesListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListClusterTemplatesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useClusterTemplates = (params: ListClusterTemplatesParams = {}) =>
  useApiQuery<ClusterTemplatesListResponse, ClusterTemplate[]>({
    queryKey: ['v1/cluster_templates', null, params],
    select: (data) => data.items,
    meta: { decode: ClusterTemplatesListResponseSchema },
  });

export const useClusterTemplate = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<ClusterTemplate>({
    queryKey: ['v1/cluster_templates', [trimmedId]],
    meta: { decode: ClusterTemplateSchema },
    enabled: Boolean(trimmedId),
  });
};

const invalidateClusterTemplatesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/cluster_templates', null) });
};

export const useCreateClusterTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<ClusterTemplate, 'id'>) =>
      apiFetch<ClusterTemplate>('v1/cluster_templates', {
        method: 'POST',
        body,
        decode: ClusterTemplateSchema,
      }),
    onSuccess: () => invalidateClusterTemplatesQueries(qc),
    retry: false,
  });
};

export const usePatchClusterTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ClusterTemplate> }) =>
      apiFetch<ClusterTemplate>('v1/cluster_templates', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
        decode: ClusterTemplateSchema,
      }),
    onSuccess: () => invalidateClusterTemplatesQueries(qc),
    retry: false,
  });
};

export const useDeleteClusterTemplate = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/cluster_templates', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateClusterTemplatesQueries(qc),
    retry: false,
  });
};

export const clusterTemplateNodeSetsSummary = (template: ClusterTemplate): string => {
  const sets = Object.entries(template.nodeSets ?? {});
  if (sets.length === 0) {
    return '—';
  }
  return sets.map(([name, ns]) => `${name} ×${ns.size}`).join(' + ');
};

export const isAiGridTemplate = (template: ClusterTemplate): boolean =>
  template.metadata?.labels?.['workload'] === 'ai' ||
  Object.keys(template.nodeSets ?? {}).some((k) => k === 'gpu');

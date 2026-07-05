import { useMutation } from '@tanstack/react-query';

import {
  type Project,
  ProjectSchema,
  type ProjectsListResponse,
  ProjectsListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListProjectsParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useProjects = (params: ListProjectsParams = {}) =>
  useApiQuery<ProjectsListResponse, Project[]>({
    queryKey: ['v1/projects', null, params],
    select: (data: ProjectsListResponse) => data.items,
    meta: { decode: ProjectsListResponseSchema },
  });

export const useProject = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<Project>({
    queryKey: ['v1/projects', [trimmedId]],
    meta: { decode: ProjectSchema },
    enabled: Boolean(trimmedId),
  });
};

export const invalidateProjectsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/projects', null) });
};

export type CreateProjectBody = {
  metadata: { name: string; labels?: Record<string, string> };
  spec: { title: string; description?: string };
};

export const useCreateProject = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectBody) =>
      apiFetch<Project>('v1/projects', { method: 'POST', body }),
    onSuccess: () => invalidateProjectsQueries(qc),
    retry: false,
  });
};

export const useDeleteProject = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/projects', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateProjectsQueries(qc),
    retry: false,
  });
};

export type { Project };

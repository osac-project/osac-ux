import { useMutation } from '@tanstack/react-query';

import {
  type ProjectMembership,
  type ProjectMembershipRole,
  type ProjectMembershipsListResponse,
  ProjectMembershipsListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListProjectMembershipsParams = {
  projectId?: string;
};

const invalidateMemberships = async (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/project_memberships') });

export const useProjectMemberships = ({ projectId }: ListProjectMembershipsParams = {}) => {
  const filter = projectId ? `this.spec.project == '${projectId}'` : undefined;

  return useApiQuery<ProjectMembershipsListResponse, ProjectMembership[]>({
    queryKey: ['v1/project_memberships', null, filter ? { filter } : {}],
    select: (data: ProjectMembershipsListResponse) => {
      const items = data.items ?? [];
      // Client-side filter for demo mode (server applies CEL in production)
      if (projectId) {
        return items.filter((m) => m.spec?.project === projectId);
      }
      return items;
    },
    meta: { decode: ProjectMembershipsListResponseSchema },
    enabled: Boolean(projectId),
  });
};

export type CreateProjectMembershipBody = {
  metadata?: { name?: string };
  spec: {
    project: string;
    role: ProjectMembershipRole;
    member: { case: 'user'; value: string };
  };
};

export const useCreateProjectMembership = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectMembershipBody) =>
      apiFetch<ProjectMembership>('v1/project_memberships', { method: 'POST', body }),
    onSuccess: () => invalidateMemberships(qc),
    retry: false,
  });
};

export const useDeleteProjectMembership = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/project_memberships', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateMemberships(qc),
    retry: false,
  });
};

export type { ProjectMembership };

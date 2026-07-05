import { useMutation } from '@tanstack/react-query';

import type { User, UsersListResponse } from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListUsersParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useUsers = (params: ListUsersParams = {}) => {
  return useApiQuery<UsersListResponse, User[]>({
    queryKey: ['v1/users', null, params],
    select: (data) => data.items,
  });
};

export const useCreateUser = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      spec: {
        username: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }) => apiFetch<User>('v1/users', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/users') }),
    retry: false,
  });
};

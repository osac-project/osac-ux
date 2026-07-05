// @temp-api — no fulfillment-service proto yet
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface LoadBalancerListener {
  protocol: 'TCP' | 'HTTP' | 'HTTPS' | 'UDP';
  port: number;
  targetPort: number;
}

export interface LoadBalancer {
  id: string;
  metadata?: { name: string; creationTimestamp?: string; creator?: string };
  spec: {
    virtualNetwork: string;
    subnet: string;
    listeners: LoadBalancerListener[];
    description?: string;
  };
  status: {
    state: 'PENDING' | 'READY' | 'UPDATING' | 'DELETING' | 'FAILED';
    internalIpAddress?: string;
    externalIpAddress?: string;
    message?: string;
  };
}

interface LoadBalancersListResponse {
  items: LoadBalancer[];
}

const invalidate = async (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/load_balancers') });

export const useLoadBalancers = () =>
  useApiQuery<LoadBalancersListResponse, LoadBalancer[]>({
    queryKey: ['v1/load_balancers'],
    select: (data: LoadBalancersListResponse) => data.items,
  });

export const useCreateLoadBalancer = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: Omit<LoadBalancer, 'id' | 'status'>) =>
      apiFetch<LoadBalancer>('v1/load_balancers', { method: 'POST', body }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

export const useDeleteLoadBalancer = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/load_balancers', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

export const usePatchLoadBalancer = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<LoadBalancer, 'id' | 'status'>>;
    }) =>
      apiFetch<LoadBalancer>('v1/load_balancers', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidate(qc),
    retry: false,
  });
};

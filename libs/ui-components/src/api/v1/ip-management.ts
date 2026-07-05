import { useMutation } from '@tanstack/react-query';

import {
  type ExternalIP,
  type ExternalIPAttachment,
  type ExternalIPAttachmentsListResponse,
  ExternalIPAttachmentsListResponseSchema,
  type ExternalIPPool,
  type ExternalIPPoolsListResponse,
  ExternalIPPoolsListResponseSchema,
  type ExternalIPsListResponse,
  ExternalIPsListResponseSchema,
  type PublicIP,
  type PublicIPAttachment,
  type PublicIPAttachmentsListResponse,
  PublicIPAttachmentsListResponseSchema,
  type PublicIPPool,
  type PublicIPPoolsListResponse,
  PublicIPPoolsListResponseSchema,
  type PublicIPsListResponse,
  PublicIPsListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

// ---------------------------------------------------------------------------
// Public IP Pools
// ---------------------------------------------------------------------------

export const usePublicIPPools = () =>
  useApiQuery<PublicIPPoolsListResponse, PublicIPPool[]>({
    queryKey: ['v1/public_ip_pools'],
    select: (data: PublicIPPoolsListResponse) => data.items,
    meta: { decode: PublicIPPoolsListResponseSchema },
  });

export const useCreatePublicIPPool = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      metadata: { name: string; tenant?: string };
      spec: { ipFamily: number };
    }) => apiFetch<PublicIPPool>('v1/public_ip_pools', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ip_pools') }),
    retry: false,
  });
};

export const useDeletePublicIPPool = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/public_ip_pools', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ip_pools') }),
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// Public IPs
// ---------------------------------------------------------------------------

export const usePublicIPs = () =>
  useApiQuery<PublicIPsListResponse, PublicIP[]>({
    queryKey: ['v1/public_ips'],
    select: (data: PublicIPsListResponse) => data.items,
    meta: { decode: PublicIPsListResponseSchema },
  });

export const useCreatePublicIP = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { spec: { pool: string } }) =>
      apiFetch<PublicIP>('v1/public_ips', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ips') }),
    retry: false,
  });
};

export const useDeletePublicIP = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/public_ips', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ips') }),
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// Public IP Attachments
// ---------------------------------------------------------------------------

export const usePublicIPAttachments = () =>
  useApiQuery<PublicIPAttachmentsListResponse, PublicIPAttachment[]>({
    queryKey: ['v1/public_ip_attachments'],
    select: (data: PublicIPAttachmentsListResponse) => data.items,
    meta: { decode: PublicIPAttachmentsListResponseSchema },
  });

export const useCreatePublicIPAttachment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      spec: {
        publicIp: string;
        target: { case: 'computeInstance' | 'cluster' | 'baremetalInstance'; value: string };
      };
    }) => apiFetch<PublicIPAttachment>('v1/public_ip_attachments', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ip_attachments') }),
    retry: false,
  });
};

export const useDeletePublicIPAttachment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/public_ip_attachments', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/public_ip_attachments') }),
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// External IP Pools
// ---------------------------------------------------------------------------

export const useExternalIPPools = () =>
  useApiQuery<ExternalIPPoolsListResponse, ExternalIPPool[]>({
    queryKey: ['v1/external_ip_pools'],
    select: (data: ExternalIPPoolsListResponse) => data.items,
    meta: { decode: ExternalIPPoolsListResponseSchema },
  });

export const useCreateExternalIPPool = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    // @temp-api spec.cidr + spec.zone are predicted proto additions (field 4/5 in ExternalIPPoolSpec)
    mutationFn: (body: {
      metadata: { name: string; tenant?: string };
      spec: { ipFamily: number; cidr?: string; zone?: string };
    }) => apiFetch<ExternalIPPool>('v1/external_ip_pools', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_pools') }),
    retry: false,
  });
};

export const useDeleteExternalIPPool = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/external_ip_pools', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_pools') }),
    retry: false,
  });
};

export const usePatchExternalIPPool = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { metadata: { tenant?: string } } }) =>
      apiFetch<ExternalIPPool>('v1/external_ip_pools', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_pools') }),
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// External IPs
// ---------------------------------------------------------------------------

export const useExternalIPs = () =>
  useApiQuery<ExternalIPsListResponse, ExternalIP[]>({
    queryKey: ['v1/external_ips'],
    select: (data: ExternalIPsListResponse) => data.items,
    meta: { decode: ExternalIPsListResponseSchema },
  });

export const useCreateExternalIP = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { spec: { pool: string } }) =>
      apiFetch<ExternalIP>('v1/external_ips', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ips') }),
    retry: false,
  });
};

export const useDeleteExternalIP = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/external_ips', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ips') }),
    retry: false,
  });
};

// ---------------------------------------------------------------------------
// External IP Attachments
// ---------------------------------------------------------------------------

export const useExternalIPAttachments = () =>
  useApiQuery<ExternalIPAttachmentsListResponse, ExternalIPAttachment[]>({
    queryKey: ['v1/external_ip_attachments'],
    select: (data: ExternalIPAttachmentsListResponse) => data.items,
    meta: { decode: ExternalIPAttachmentsListResponseSchema },
  });

export const useCreateExternalIPAttachment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      spec: {
        externalIp: string;
        target: { case: 'computeInstance' | 'cluster' | 'baremetalInstance'; value: string };
      };
    }) => apiFetch<ExternalIPAttachment>('v1/external_ip_attachments', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_attachments') }),
    retry: false,
  });
};

export const useDeleteExternalIPAttachment = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/external_ip_attachments', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/external_ip_attachments') }),
    retry: false,
  });
};

export type {
  PublicIP,
  PublicIPPool,
  PublicIPAttachment,
  ExternalIP,
  ExternalIPPool,
  ExternalIPAttachment,
};

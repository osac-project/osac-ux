import { useMutation } from '@tanstack/react-query';

import {
  type NetworkClass,
  NetworkClassSchema,
  type NetworkClassesListResponse,
  NetworkClassesListResponseSchema,
  type SecurityGroup,
  SecurityGroupSchema,
  type SecurityGroupsListResponse,
  SecurityGroupsListResponseSchema,
  type Subnet,
  SubnetSchema,
  type SubnetsListResponse,
  SubnetsListResponseSchema,
  type VirtualNetwork,
  VirtualNetworkSchema,
  type VirtualNetworksListResponse,
  VirtualNetworksListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListNetworkingParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type NetworkingQueryOptions = {
  enabled?: boolean;
};

export const useVirtualNetworks = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<VirtualNetworksListResponse, VirtualNetwork[]>({
    queryKey: ['v1/virtual_networks', null, params],
    select: (data) => data.items,
    meta: { decode: VirtualNetworksListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useSubnets = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<SubnetsListResponse, Subnet[]>({
    queryKey: ['v1/subnets', null, params],
    select: (data) => data.items,
    meta: { decode: SubnetsListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useSecurityGroups = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<SecurityGroupsListResponse, SecurityGroup[]>({
    queryKey: ['v1/security_groups', null, params],
    select: (data) => data.items,
    meta: { decode: SecurityGroupsListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useSecurityGroup = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<SecurityGroup>({
    queryKey: ['v1/security_groups', [trimmedId]],
    meta: { decode: SecurityGroupSchema },
    enabled: Boolean(trimmedId),
  });
};

export const useVirtualNetwork = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<VirtualNetwork>({
    queryKey: ['v1/virtual_networks', [trimmedId]],
    meta: { decode: VirtualNetworkSchema },
    enabled: Boolean(trimmedId),
  });
};

export const useNetworkClasses = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<NetworkClassesListResponse, NetworkClass[]>({
    queryKey: ['v1/network_classes', null, params],
    select: (data) => data.items,
    meta: { decode: NetworkClassesListResponseSchema },
    enabled: options.enabled ?? true,
  });

// ---------------------------------------------------------------------------
// NetworkClass mutations (provider admin)
// ---------------------------------------------------------------------------

export type CreateNetworkClassInput = {
  name: string;
  title: string;
  description?: string;
  supportsIpv4: boolean;
  supportsIpv6: boolean;
  supportsDualStack: boolean;
  isDefault?: boolean;
};

export const invalidateNetworkClassesQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/network_classes', null) });
};

export const useCreateNetworkClass = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      title,
      description,
      supportsIpv4,
      supportsIpv6,
      supportsDualStack,
      isDefault,
    }: CreateNetworkClassInput) =>
      apiFetch<NetworkClass>('v1/network_classes', {
        method: 'POST',
        body: {
          metadata: { name },
          title,
          ...(description ? { description } : {}),
          capabilities: {
            supports_ipv4: supportsIpv4,
            supports_ipv6: supportsIpv6,
            supports_dual_stack: supportsDualStack,
          },
          ...(isDefault != null ? { is_default: isDefault } : {}),
        },
        decode: NetworkClassSchema,
      }),
    onSuccess: () => invalidateNetworkClassesQueries(qc),
  });
};

export const useDeleteNetworkClass = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/network_classes', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateNetworkClassesQueries(qc),
  });
};

// ---------------------------------------------------------------------------
// Invalidation helpers
// ---------------------------------------------------------------------------

export const invalidateVirtualNetworksQueries = async (
  qc: ReturnType<typeof useApiQueryClient>,
) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/virtual_networks', null) });
};

export const invalidateSubnetsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/subnets', null) });
};

export const invalidateSecurityGroupsQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/security_groups', null) });
};

// ---------------------------------------------------------------------------
// VirtualNetwork mutations
// ---------------------------------------------------------------------------

export type CreateVirtualNetworkInput = {
  name: string;
  networkClass: string;
  ipv4Cidr?: string;
};

export const useCreateVirtualNetwork = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ name, networkClass, ipv4Cidr }: CreateVirtualNetworkInput) =>
      apiFetch<VirtualNetwork>('v1/virtual_networks', {
        method: 'POST',
        body: {
          metadata: { name },
          spec: {
            network_class: networkClass,
            ...(ipv4Cidr ? { ipv4_cidr: ipv4Cidr } : {}),
          },
        },
        decode: VirtualNetworkSchema,
      }),
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

export const useDeleteVirtualNetwork = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/virtual_networks', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

// ---------------------------------------------------------------------------
// Subnet mutations
// ---------------------------------------------------------------------------

export type CreateSubnetInput = {
  name: string;
  virtualNetworkId: string;
  ipv4Cidr: string;
};

export const useCreateSubnet = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ name, virtualNetworkId, ipv4Cidr }: CreateSubnetInput) =>
      apiFetch<Subnet>('v1/subnets', {
        method: 'POST',
        body: {
          metadata: { name },
          spec: { virtual_network: virtualNetworkId, ipv4_cidr: ipv4Cidr },
        },
        decode: SubnetSchema,
      }),
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

export const useDeleteSubnet = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/subnets', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

/** Temporary PATCH hook — replace with fulfillment-service-supplied endpoint when available. */
export type PatchSubnetInput = {
  id: string;
  ipv4Cidr?: string;
  ipv6Cidr?: string;
};

export const usePatchSubnet = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, ipv4Cidr, ipv6Cidr }: PatchSubnetInput) =>
      apiFetch<Subnet>('v1/subnets', {
        pathParams: [id],
        method: 'PATCH',
        body: {
          spec: {
            ...(ipv4Cidr != null ? { ipv4_cidr: ipv4Cidr } : {}),
            ...(ipv6Cidr != null ? { ipv6_cidr: ipv6Cidr } : {}),
          },
        },
        decode: SubnetSchema,
      }),
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

// ---------------------------------------------------------------------------
// SecurityGroup mutations
// ---------------------------------------------------------------------------

export type SecurityRuleInput = {
  protocol: number;
  portFrom?: number;
  portTo?: number;
  ipv4Cidr?: string;
};

export type CreateSecurityGroupInput = {
  name: string;
  virtualNetworkId: string;
  ingress: SecurityRuleInput[];
  egress: SecurityRuleInput[];
};

export const useCreateSecurityGroup = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ name, virtualNetworkId, ingress, egress }: CreateSecurityGroupInput) =>
      apiFetch<SecurityGroup>('v1/security_groups', {
        method: 'POST',
        body: {
          metadata: { name },
          spec: {
            virtual_network: virtualNetworkId,
            ingress: ingress.map(({ protocol, portFrom, portTo, ipv4Cidr }) => ({
              protocol,
              ...(portFrom != null ? { port_from: portFrom } : {}),
              ...(portTo != null ? { port_to: portTo } : {}),
              ...(ipv4Cidr ? { ipv4_cidr: ipv4Cidr } : {}),
            })),
            egress: egress.map(({ protocol, portFrom, portTo, ipv4Cidr }) => ({
              protocol,
              ...(portFrom != null ? { port_from: portFrom } : {}),
              ...(portTo != null ? { port_to: portTo } : {}),
              ...(ipv4Cidr ? { ipv4_cidr: ipv4Cidr } : {}),
            })),
          },
        },
        decode: SecurityGroupSchema,
      }),
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};

/** Temporary PATCH hook — replace with fulfillment-service-supplied endpoint when available. */
export type PatchSecurityGroupInput = {
  id: string;
  ingress: SecurityRuleInput[];
  egress: SecurityRuleInput[];
};

const serializeRules = (rules: SecurityRuleInput[]) =>
  rules.map(({ protocol, portFrom, portTo, ipv4Cidr }) => ({
    protocol,
    ...(portFrom != null ? { port_from: portFrom } : {}),
    ...(portTo != null ? { port_to: portTo } : {}),
    ...(ipv4Cidr ? { ipv4_cidr: ipv4Cidr } : {}),
  }));

export const usePatchSecurityGroup = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, ingress, egress }: PatchSecurityGroupInput) =>
      apiFetch<SecurityGroup>('v1/security_groups', {
        pathParams: [id],
        method: 'PATCH',
        body: { spec: { ingress: serializeRules(ingress), egress: serializeRules(egress) } },
        decode: SecurityGroupSchema,
      }),
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};

export const useDeleteSecurityGroup = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/security_groups', { pathParams: [id], method: 'DELETE' }),
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export const virtualNetworkFilterForSubnetList = (virtualNetworkId: string): string =>
  `this.spec.virtual_network == "${virtualNetworkId}"`;

export const resourceDisplayName = (metadata?: { name?: string }, id?: string): string =>
  metadata?.name?.trim() || id?.trim() || '—';

export const formatResourceIdsForReview = (
  ids: string[],
  resources: Array<{ id: string; metadata?: { name?: string } }>,
): string => {
  if (ids.length === 0) {
    return '—';
  }

  return ids
    .map((id) => {
      const resource = resources.find((item) => item.id === id);
      return resourceDisplayName(resource?.metadata, id);
    })
    .join(', ');
};

export const formatResourceIdForReview = (
  id: string,
  resources: Array<{ id: string; metadata?: { name?: string } }>,
): string => formatResourceIdsForReview(id.trim() ? [id] : [], resources);

import { UseQueryOptions } from '@tanstack/react-query';

import type { FulfillmentDecodeSchema } from './fulfillment-decode';

/**
 * All known API base routes. Adding a new resource hook requires adding its
 * route here first — unknown strings are rejected at compile time everywhere
 * a query key is constructed or used for cache operations.
 */
export type ApiRoute =
  // Compute / VM
  | 'v1/compute_instances'
  | 'v1/compute_instance_templates'
  | 'v1/compute_instance_catalog_items'
  // Cluster / CaaS
  | 'v1/clusters'
  | 'v1/cluster_templates'
  | 'v1/cluster_catalog_items'
  // Bare Metal
  | 'v1/baremetal_instances'
  | 'v1/baremetal_instance_templates'
  | 'v1/baremetal_instance_catalog_items'
  | 'v1/host_types'
  // Infrastructure
  | 'v1/instance_types'
  // Networking
  | 'v1/virtual_networks'
  | 'v1/subnets'
  | 'v1/security_groups'
  | 'v1/network_classes'
  // IP Management
  | 'v1/public_ips'
  | 'v1/public_ip_pools'
  | 'v1/public_ip_attachments'
  | 'v1/external_ips'
  | 'v1/external_ip_pools'
  | 'v1/external_ip_attachments'
  // Identity / Tenant / RBAC
  | 'v1/tenants'
  | 'v1/organizations'
  | 'v1/projects'
  | 'v1/project_memberships'
  | 'v1/users'
  | 'v1/roles'
  | 'v1/role_bindings'
  | 'v1/identity_providers'
  // Console
  | 'v1/console_sessions'
  // System
  | 'v1/capabilities'
  | 'v1/events'
  // Storage (@temp-api — not yet in fulfillment-service)
  | 'v1/storage_tiers'
  | 'v1/block_volumes'
  | 'v1/volume_snapshots'
  | 'v1/object_storage_buckets'
  | 'v1/bucket_access_keys'
  // Load Balancer (@temp-api — not yet in fulfillment-service)
  | 'v1/load_balancers'
  // MaaS (@temp-api — not yet in fulfillment-service)
  | 'v1/ai_environments'
  | 'v1/model_catalog_items'
  | 'v1/model_accesses'
  // Private-only
  | 'v1/hubs'
  | 'v1/storage_backends';

/**
 * Strict 3-part tuple that encodes an API address.
 * The QueryClient in the app constructs the URL as:
 *   /<baseUrl>/<pathParams[0]>/<pathParams[1]>?<queryParams>
 */
export type ApiQueryKey = [
  baseUrl: ApiRoute,
  pathParams?: (string | number)[] | null,
  queryParams?: Record<string, string | number | boolean | null | undefined>,
];

export type ApiQueryMeta = {
  decode?: FulfillmentDecodeSchema;
};

export type UseApiQueryOptions<TQueryFnData, TError, TData> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, ApiQueryKey>,
  'queryKey' | 'meta' | 'queryFn'
> & {
  queryKey: ApiQueryKey;
  meta?: ApiQueryMeta;
};

/**
 * Type-safe factory for query keys used in cache operations
 * (invalidateQueries, refetchQueries, setQueryData, etc.).
 *
 * @example
 * qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instances') });
 */
export const apiQueryKey = (
  baseUrl: ApiRoute,
  pathParams?: (string | number)[] | null,
  queryParams?: ApiQueryKey[2],
): ApiQueryKey => [baseUrl, pathParams, queryParams];

export type ApiQueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Options shared by reads (queryFn) and writes (mutationFn).
 * The app's ApiProvider constructs the final URL and handles credentials /
 * error handling — callers only supply the route and what varies per call.
 */
export type ApiFetchOptions = {
  /** Dynamic path segments appended after the route, e.g. ['abc-123'] → /v1/compute_instances/abc-123 */
  pathParams?: (string | number)[] | null;
  /** Query-string parameters (GET requests / filtering). */
  queryParams?: ApiQueryParams;
  /** HTTP method — defaults to 'GET'. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request body — serialised to JSON by the provider. */
  body?: unknown;
  /** Parse the response with protobuf `fromJson` using the given message schema. */
  decode?: FulfillmentDecodeSchema;
};

/**
 * Typed fetch function provided by ApiProvider.
 * The first argument must be a known ApiRoute; the provider prepends the
 * app-level base URL so callers never hard-code it.
 */
export type ApiFetch = <T = unknown>(route: ApiRoute, options?: ApiFetchOptions) => Promise<T>;

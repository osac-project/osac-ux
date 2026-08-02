/**
 * Curated allow-list of API routes a Tenant Admin can pick as the value source for a
 * custom catalog field. Restricting to a known set (vs. an arbitrary free-text route)
 * avoids exposing unrelated/unsafe endpoints while still letting a field's value be
 * chosen from a live, API-backed list instead of typed freeform.
 */
import type { ApiRoute } from '../../api/types';

export interface CustomFieldApiSource {
  path: ApiRoute;
  label: string;
}

export const CUSTOM_FIELD_API_SOURCES: CustomFieldApiSource[] = [
  { path: 'v1/instance_types', label: 'Instance types' },
  { path: 'v1/host_types', label: 'Host types' },
  { path: 'v1/virtual_networks', label: 'Virtual networks' },
  { path: 'v1/storage_tiers', label: 'Storage tiers' },
  { path: 'v1/identity_providers', label: 'Identity providers' },
];

export const findCustomFieldApiSource = (path: string): CustomFieldApiSource | undefined =>
  CUSTOM_FIELD_API_SOURCES.find((source) => source.path === path);

/**
 * @temp-api — Template billing + publish state helpers (REQ-BA-2, catalog authorship shift)
 *
 * ClusterTemplate / ComputeInstanceTemplate / BareMetalInstanceTemplate protos
 * have no first-class `published` flag or BillableComponent list yet. Until
 * the proto ships, both are stored on Metadata (which every Template already
 * has: name, labels, annotations):
 *
 *   published            -> metadata.labels['osac.io/published']       ('true' | 'false')
 *   BillableComponent[]  -> metadata.annotations['osac.io/billable-components']  (JSON)
 *
 * Publish state gates whether a Tenant Admin can see this Template when
 * combining published Templates into tenant-scoped CatalogItems — CSP Admin
 * publishes Templates; only Tenant Admin creates CatalogItems from them.
 */

import type { BillableComponent } from './billing-types';

const PUBLISHED_LABEL = 'osac.io/published';
const BILLABLE_COMPONENTS_ANNOTATION = 'osac.io/billable-components';
const ALLOWED_TENANTS_ANNOTATION = 'osac.io/allowed-tenants';

export interface TemplateLike {
  metadata?: {
    name?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

/** Templates created before this flag existed default to published=true (no regression). */
export const isTemplatePublished = (template: TemplateLike): boolean =>
  (template.metadata?.labels?.[PUBLISHED_LABEL] ?? 'true') !== 'false';

export const readBillableComponents = (template: TemplateLike): BillableComponent[] => {
  const raw = template.metadata?.annotations?.[BILLABLE_COMPONENTS_ANNOTATION];
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BillableComponent[]) : [];
  } catch {
    return [];
  }
};

export const BILLABLE_COMPONENTS_KEY = BILLABLE_COMPONENTS_ANNOTATION;

/** Empty list (or absent annotation) means the template is shared with every tenant. */
export const readAllowedTenants = (template: TemplateLike): string[] => {
  const raw = template.metadata?.annotations?.[ALLOWED_TENANTS_ANNOTATION];
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

export const isTemplateAllowedForTenant = (template: TemplateLike, tenantId: string): boolean => {
  const list = readAllowedTenants(template);
  return list.length === 0 || list.includes(tenantId);
};

/** Effective rate for one component: the tenant's plan override, or the template's base rate. */
export const effectiveComponentRate = (
  component: BillableComponent,
  rateOverrides: Record<string, string> | undefined,
): number => {
  const override = rateOverrides?.[component.meterKey];
  const raw = override ?? component.baseRate;
  const num = parseFloat(raw);
  return isNaN(num) ? 0 : num;
};

/** Sums the effective rate of every 'hour'-unit component — the recurring hourly cost. */
export const totalHourlyRate = (
  components: BillableComponent[],
  rateOverrides: Record<string, string> | undefined,
): number =>
  components
    .filter((c) => c.unit === 'hour')
    .reduce((sum, c) => sum + effectiveComponentRate(c, rateOverrides), 0);

/**
 * Builds a metadata patch carrying both the published flag and the
 * BillableComponent list, merged on top of the template's existing labels /
 * annotations so unrelated keys are preserved.
 */
export const buildTemplateMetadataPatch = (
  template: TemplateLike,
  {
    published,
    billableComponents,
    allowedTenants,
  }: { published: boolean; billableComponents: BillableComponent[]; allowedTenants?: string[] },
) => ({
  ...template.metadata,
  labels: { ...(template.metadata?.labels ?? {}), [PUBLISHED_LABEL]: String(published) },
  annotations: {
    ...(template.metadata?.annotations ?? {}),
    [BILLABLE_COMPONENTS_ANNOTATION]: JSON.stringify(billableComponents),
    [ALLOWED_TENANTS_ANNOTATION]: JSON.stringify(allowedTenants ?? []),
  },
});

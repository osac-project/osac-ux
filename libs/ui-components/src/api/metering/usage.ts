/**
 * @temp-api — Metering Usage Query (OSAC-985, Milestone 0.3)
 *
 * The metering service is a future standalone service separate from fulfillment-service.
 * Base URL: /api/metering/v1  (not in ApiRoute — different service boundary)
 *
 * Milestone 0.3: metering data collection (per-second granularity)
 * Milestone 0.4: costing / billing / quota enforcement (deferred)
 *
 * Charge formula: estimatedCost = uptimeSeconds × (pricePerHour / 3600)
 * Pricing dimensions:
 *   - VMaaS → InstanceType (instance-type-seconds, running VMs only)
 *   - CaaS  → HostType per node_set (host-type-seconds, active clusters only)
 *   - MaaS  → per-token (input/output/cached — AI Grid, future)
 */

export interface CapacityMeteringEntry {
  resourceType: 'compute_instance' | 'cluster' | 'baremetal_instance';
  resourceId: string;
  resourceName: string;
  /** InstanceType name for VMs, HostType name for clusters/BM */
  resourceClass: string;
  /** instance-type-seconds or host-type-seconds */
  uptimeSeconds: number;
  /** From metadata.labels.price_per_hour on InstanceType or HostType */
  pricePerHour: number;
  /** uptimeSeconds × (pricePerHour / 3600) */
  estimatedCost: number;
}

/**
 * @temp-api — MaaS metering (AI Grid, Milestone 0.4)
 * Consumption-based: charged per token, not per uptime-second.
 */
export interface MaaSMeteringEntry {
  resourceType: 'model_access';
  resourceId: string;
  /** Access / application name */
  resourceName: string;
  /** ModelCatalogItem title */
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestCount: number;
  pricePerInputToken: number;
  pricePerOutputToken: number;
  pricePerCachedToken: number;
  /** (inputTokens × pricePerInputToken) + (outputTokens × pricePerOutputToken) + (cachedTokens × pricePerCachedToken) */
  estimatedCost: number;
}

export type MeteringResourceEntry = CapacityMeteringEntry | MaaSMeteringEntry;

export interface MeteringUsageSummary {
  tenantId: string;
  period: 'current_month' | 'last_month';
  resources: MeteringResourceEntry[];
  totalEstimatedCost: number;
  currency: 'USD';
}

const METERING_BASE = '/api/metering/v1';

/** Demo-mode mock data mirroring running resources in mock-store */
const MOCK_USAGE: MeteringUsageSummary = {
  tenantId: 'tenant-001',
  period: 'current_month',
  resources: [
    {
      resourceType: 'compute_instance',
      resourceId: 'vm-001',
      resourceName: 'web-server-1',
      resourceClass: 'small',
      uptimeSeconds: 432_000, // 5 days
      pricePerHour: 0.05,
      estimatedCost: parseFloat((432_000 * (0.05 / 3600)).toFixed(4)),
    },
    {
      resourceType: 'compute_instance',
      resourceId: 'vm-002',
      resourceName: 'db-server-1',
      resourceClass: 'medium',
      uptimeSeconds: 259_200, // 3 days
      pricePerHour: 0.12,
      estimatedCost: parseFloat((259_200 * (0.12 / 3600)).toFixed(4)),
    },
    {
      resourceType: 'cluster',
      resourceId: 'cluster-001',
      resourceName: 'prod-cluster',
      resourceClass: 'standard-32',
      uptimeSeconds: 86_400, // 1 day
      pricePerHour: 0.4,
      estimatedCost: parseFloat((86_400 * (0.4 / 3600)).toFixed(4)),
    },
    {
      resourceType: 'model_access' as const,
      resourceId: 'maas-access-001',
      resourceName: 'RAG Pipeline',
      modelName: 'Llama 3.2 — 3B',
      inputTokens: 250_000,
      outputTokens: 80_000,
      cachedTokens: 20_000,
      requestCount: 1_200,
      pricePerInputToken: 0.000002,
      pricePerOutputToken: 0.000006,
      pricePerCachedToken: 0.0000005,
      estimatedCost: parseFloat(
        (250_000 * 0.000002 + 80_000 * 0.000006 + 20_000 * 0.0000005).toFixed(4),
      ),
    },
  ],
  totalEstimatedCost: 0,
  currency: 'USD',
};

MOCK_USAGE.totalEstimatedCost = parseFloat(
  MOCK_USAGE.resources.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(4),
);

/** Second tenant, used by provider-scoped reports (Acme Corp / tenant-002). */
const MOCK_USAGE_TENANT_002: MeteringUsageSummary = {
  tenantId: 'tenant-002',
  period: 'current_month',
  resources: [
    {
      resourceType: 'compute_instance',
      resourceId: 'vm-004',
      resourceName: 'test-runner-1',
      resourceClass: 'small',
      uptimeSeconds: 172_800, // 2 days
      pricePerHour: 0.05,
      estimatedCost: parseFloat((172_800 * (0.05 / 3600)).toFixed(4)),
    },
    {
      resourceType: 'cluster',
      resourceId: 'cluster-003',
      resourceName: 'staging-cluster',
      resourceClass: 'standard-32',
      uptimeSeconds: 43_200, // 0.5 day
      pricePerHour: 0.4,
      estimatedCost: parseFloat((43_200 * (0.4 / 3600)).toFixed(4)),
    },
  ],
  totalEstimatedCost: 0,
  currency: 'USD',
};
MOCK_USAGE_TENANT_002.totalEstimatedCost = parseFloat(
  MOCK_USAGE_TENANT_002.resources.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(4),
);

const MOCK_USAGE_BY_TENANT: Record<string, MeteringUsageSummary> = {
  'tenant-001': MOCK_USAGE,
  'tenant-002': MOCK_USAGE_TENANT_002,
};

export interface UsageFetchOptions {
  tenantId?: string;
  period?: 'current_month' | 'last_month';
  /** Restrict the summary to a single resource — used by per-resource usage widgets. */
  resourceId?: string;
  /** Use mock data (demo mode) */
  demo?: boolean;
}

const scopeToResource = (
  summary: MeteringUsageSummary,
  resourceId?: string,
): MeteringUsageSummary => {
  if (!resourceId) {
    return summary;
  }
  const resources = summary.resources.filter((r) => r.resourceId === resourceId);
  return {
    ...summary,
    resources,
    totalEstimatedCost: parseFloat(
      resources.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(4),
    ),
  };
};

export async function fetchMeteringUsage(
  options: UsageFetchOptions = {},
): Promise<MeteringUsageSummary> {
  if (options.demo) {
    const base = MOCK_USAGE_BY_TENANT[options.tenantId ?? 'tenant-001'] ?? MOCK_USAGE;
    return scopeToResource(
      { ...base, tenantId: options.tenantId ?? base.tenantId },
      options.resourceId,
    );
  }
  const params = new URLSearchParams();
  if (options.tenantId) {
    params.set('tenant_id', options.tenantId);
  }
  if (options.period) {
    params.set('period', options.period);
  }
  if (options.resourceId) {
    params.set('resource_id', options.resourceId);
  }
  const url = `${METERING_BASE}/usage?${params}`;
  const res = await window.fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Metering API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<MeteringUsageSummary>;
}

/**
 * @temp-api — Provider-scoped usage across all tenants (REQ-BA-4 billing-admin gate).
 * Real implementation will query Koku's cross-tenant cost report, tagged by organization_id.
 */
export async function fetchAllTenantsMeteringUsage(
  options: Pick<UsageFetchOptions, 'period' | 'demo'> = {},
): Promise<MeteringUsageSummary[]> {
  if (options.demo !== false) {
    return Object.values(MOCK_USAGE_BY_TENANT).map((s) => ({
      ...s,
      period: options.period ?? s.period,
    }));
  }
  const params = new URLSearchParams();
  if (options.period) {
    params.set('period', options.period);
  }
  const url = `${METERING_BASE}/usage/tenants?${params}`;
  const res = await window.fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Metering API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<MeteringUsageSummary[]>;
}

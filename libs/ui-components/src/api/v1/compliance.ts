// @temp-api — compliance/security posture indicators (compliance-roadmap-signals.md, eu-sovereignty-compliance.md,
// requirements-decision-making-cluster.md REQ-CA-*). None of this is backed by fulfillment-service yet — everything
// here is either read from metadata.labels (when a provider/tenant admin has set one) or a deterministic
// pseudo-random fallback so the demo has representative, stable-per-resource data instead of blank columns.

export interface LabeledResource {
  id?: string;
  metadata?: { name?: string; labels?: Record<string, string> };
}

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const keyOf = (resource: LabeledResource): string => resource.metadata?.name ?? resource.id ?? '';

// ---------------------------------------------------------------------------
// Always-on platform flags — OSAC-3025 (mTLS), OSAC-3026 (FIPS 140-2)
// ---------------------------------------------------------------------------

export interface PlatformSecurityFlags {
  mtls: boolean;
  fips: boolean;
}

export const usePlatformSecurityFlags = (): PlatformSecurityFlags => ({
  mtls: true,
  fips: true,
});

// ---------------------------------------------------------------------------
// Sovereignty / residency — REQ-CA-1 (TenantSpec), REQ-CA-2 (HostType/catalog items)
// ---------------------------------------------------------------------------

export const JURISDICTION_LABEL = 'osac.io/jurisdiction';
export const JURISDICTIONS = ['EU', 'US', 'Unrestricted'] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];

export const tenantJurisdiction = (tenant: LabeledResource): Jurisdiction => {
  const explicit = tenant.metadata?.labels?.[JURISDICTION_LABEL];
  if (explicit && (JURISDICTIONS as readonly string[]).includes(explicit)) {
    return explicit as Jurisdiction;
  }
  return JURISDICTIONS[hashString(keyOf(tenant)) % JURISDICTIONS.length];
};

export const RESIDENCY_LABEL = 'osac.io/residency';
export const RESIDENCY_TAGS = ['EU-only', 'US-only', 'Unrestricted'] as const;
export type ResidencyTag = (typeof RESIDENCY_TAGS)[number];

export const resourceResidency = (resource: LabeledResource): ResidencyTag => {
  const explicit = resource.metadata?.labels?.[RESIDENCY_LABEL];
  if (explicit && (RESIDENCY_TAGS as readonly string[]).includes(explicit)) {
    return explicit as ResidencyTag;
  }
  return RESIDENCY_TAGS[hashString(keyOf(resource)) % RESIDENCY_TAGS.length];
};

export const RESIDENCY_COLOR: Record<ResidencyTag, 'blue' | 'purple' | 'grey'> = {
  'EU-only': 'blue',
  'US-only': 'purple',
  Unrestricted: 'grey',
};

// ---------------------------------------------------------------------------
// Per-project encryption keys — OSAC-2389 (KMS)
// ---------------------------------------------------------------------------

export const KMS_STATUS_LABEL = 'osac.io/kms-status';
export type KmsStatus = 'dedicated' | 'shared' | 'none';

export const projectKmsStatus = (project: LabeledResource): KmsStatus => {
  const explicit = project.metadata?.labels?.[KMS_STATUS_LABEL];
  if (explicit === 'dedicated' || explicit === 'shared' || explicit === 'none') {
    return explicit;
  }
  const bucket = hashString(keyOf(project)) % 5;
  return bucket === 0 ? 'none' : bucket === 1 ? 'shared' : 'dedicated';
};

// ---------------------------------------------------------------------------
// Platform-enforced network isolation — OSAC-3028 (Netris VRF-per-tenant)
// ---------------------------------------------------------------------------

export const NETWORK_ISOLATION_LABEL = 'osac.io/network-isolation';

export const networkIsolationEnforced = (networkClass: LabeledResource): boolean => {
  const explicit = networkClass.metadata?.labels?.[NETWORK_ISOLATION_LABEL];
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return false;
  }
  return hashString(keyOf(networkClass)) % 4 !== 0; // ~75% isolated by default
};

// ---------------------------------------------------------------------------
// Live compliance scanning state — OSAC-3029 (ACM/CaaS), OSAC-3031 (STIG/CIS via OpenSCAP for VMaaS/BMaaS)
// ---------------------------------------------------------------------------

export type ComplianceState = 'compliant' | 'partial' | 'noncompliant' | 'not-scanned';
export type ComplianceProfile = 'ACM (NIST 800-53)' | 'STIG' | 'CIS';

export interface ComplianceResult {
  state: ComplianceState;
  profile: ComplianceProfile;
  failingRules: string[];
}

const FAILING_RULE_POOL: Record<ComplianceProfile, string[]> = {
  'ACM (NIST 800-53)': [
    'NIST SC-13 — FIPS crypto module not detected on node',
    'NIST AC-6 — cluster-admin bound to non-break-glass user',
    'NIST AU-2 — audit log forwarding not configured',
  ],
  STIG: [
    'STIG V-230234 — SSH root login not disabled',
    'STIG V-230222 — auditd service not enabled',
    'STIG V-230489 — FIPS mode not enabled in kernel',
  ],
  CIS: [
    'CIS-5.1.3 — audit log retention below policy',
    'CIS-1.2.5 — anonymous-auth not disabled',
    'CIS-4.1.1 — permissions on kubelet config too permissive',
  ],
};

export const resourceComplianceResult = (
  resource: LabeledResource,
  profile: ComplianceProfile,
): ComplianceResult => {
  const bucket = hashString(`${profile}:${keyOf(resource)}`) % 10;
  const state: ComplianceState =
    bucket < 6 ? 'compliant' : bucket < 8 ? 'partial' : bucket < 9 ? 'noncompliant' : 'not-scanned';
  const pool = FAILING_RULE_POOL[profile];
  const failingRules =
    state === 'noncompliant' ? pool.slice(0, 2) : state === 'partial' ? pool.slice(0, 1) : [];
  return { state, profile, failingRules };
};

// ---------------------------------------------------------------------------
// Audit trail — OSAC-63 (Activity and Audit Log API)
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceKind: string;
  resourceName: string;
  tenant?: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-1',
    timestamp: hoursAgo(1),
    actor: 'provider-admin@osac.io',
    action: 'catalog_item.publish',
    resourceKind: 'ClusterCatalogItem',
    resourceName: 'ocp-4-17-small',
    tenant: 'acme-corp',
  },
  {
    id: 'evt-2',
    timestamp: hoursAgo(3),
    actor: 'jane.doe@acme-corp.io',
    action: 'compute_instance.create',
    resourceKind: 'ComputeInstance',
    resourceName: 'web-frontend-03',
    tenant: 'acme-corp',
  },
  {
    id: 'evt-3',
    timestamp: hoursAgo(6),
    actor: 'provider-admin@osac.io',
    action: 'network_class.price_update',
    resourceKind: 'NetworkClass',
    resourceName: 'sriov-fast',
  },
  {
    id: 'evt-4',
    timestamp: hoursAgo(10),
    actor: 'tenant-admin@globex.io',
    action: 'template.publish_scope_update',
    resourceKind: 'ComputeInstanceTemplate',
    resourceName: 'rhel9-standard',
    tenant: 'globex',
  },
  {
    id: 'evt-5',
    timestamp: hoursAgo(18),
    actor: 'system',
    action: 'bare_metal_instance.delete',
    resourceKind: 'BareMetalInstance',
    resourceName: 'gpu-node-07',
    tenant: 'acme-corp',
  },
  {
    id: 'evt-6',
    timestamp: hoursAgo(27),
    actor: 'provider-admin@osac.io',
    action: 'tenant.create',
    resourceKind: 'Tenant',
    resourceName: 'globex',
  },
  {
    id: 'evt-7',
    timestamp: hoursAgo(40),
    actor: 'john.smith@acme-corp.io',
    action: 'ai_environment.enable',
    resourceKind: 'AiEnvironment',
    resourceName: 'ocp-ai-cluster-1',
    tenant: 'acme-corp',
  },
];

export const useAuditEvents = () => ({
  data: MOCK_AUDIT_EVENTS,
  isLoading: false as const,
  error: undefined,
});

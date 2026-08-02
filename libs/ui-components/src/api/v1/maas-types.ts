/**
 * @temp-api — MaaS (Model as a Service) type definitions (OSAC-MaaS, Milestone 0.x)
 *
 * These interfaces describe the predicted fulfillment-service API contract for
 * AI model serving. No proto or backend implementation exists yet.
 *
 * When the real API ships:
 *  1. Replace this file with generated types from the proto
 *  2. Remove @temp-api annotations from hook files
 *  3. Run `pnpm gen:api-diff` to reclassify from temp-api → real
 *
 * API surfaces:
 *   GET/POST  /v1/ai_environments
 *   GET       /v1/ai_environments/:id
 *   GET/POST/PATCH/DELETE  /v1/model_catalog_items[/:id]
 *   GET/POST/PATCH  /v1/model_accesses[/:id]
 *   GET/POST/PATCH/DELETE  /v1/subscriptions[/:id]
 *   GET  /v1/maas_token_usage
 */

// ---------------------------------------------------------------------------
// AiEnvironment — provider-admin resource
// ---------------------------------------------------------------------------

export type AiEnvironmentState = 'PENDING' | 'PROVISIONING' | 'READY' | 'FAILED';

export interface AiEnvironment {
  id: string;
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    /** ID of the Cluster resource this AI env is tied to */
    clusterId: string;
    /** RHOAI operator version, e.g. '2.17' */
    rhoaiVersion?: string;
    /** Shared vLLM gateway endpoint, e.g. 'https://maas.apps.prod.rhoai.example.com' */
    gatewayEndpoint?: string;
    /** Model IDs pre-registered in the AI env */
    registeredModels?: string[];
  };
  status?: {
    state: AiEnvironmentState;
    /** Human-readable cluster name */
    clusterName?: string;
    /** Error detail when state = FAILED */
    message?: string;
    readyAt?: string;
  };
}

export interface AiEnvironmentsListResponse {
  items: AiEnvironment[];
}

// ---------------------------------------------------------------------------
// ModelCatalogItem — provider-admin resource (extends CatalogItemForDisplay)
// ---------------------------------------------------------------------------

/**
 * ModelCatalogItem uses the same generic CatalogItemForDisplay shape.
 * MaaS-specific labels:
 *   model_provider      — e.g. 'meta' | 'ibm'
 *   context_window      — e.g. '128k'
 *   workload            — 'ai'
 *   price_per_input_token  — USD per token (string float)
 *   price_per_output_token — USD per token (string float)
 *
 * Field definitions use:
 *   application_name       — required, editable text
 *   token_quota_monthly    — editable integer
 */
export interface ModelCatalogItem {
  id: string;
  title: string;
  description?: string;
  published?: boolean;
  tenant?: string;
  allowed_tenants?: string[];
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    /**
     * Carries osac.io/billable-components (JSON BillableComponent[]) — the
     * canonical input/output/cache token rate declaration, replacing the
     * ad-hoc price_per_input_token / price_per_output_token labels above.
     * Both are written for now; readers should prefer this annotation.
     */
    annotations?: Record<string, string>;
  };
  field_definitions?: Array<{
    path: string;
    display_name?: string;
    displayName?: string;
    editable?: boolean;
    default?: unknown;
    validation_schema?: string;
  }>;
}

export interface ModelCatalogItemsListResponse {
  items: ModelCatalogItem[];
}

// ---------------------------------------------------------------------------
// ModelAccess — tenant resource
// ---------------------------------------------------------------------------

export type ModelAccessState = 'PROVISIONING' | 'ACTIVE' | 'REVOKED';

export interface ModelAccess {
  id: string;
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    creator?: string;
    tenant?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    /** ID of the ModelCatalogItem this access is for */
    catalogItem?: string;
    applicationName?: string;
    tokenQuotaMonthly?: number;
  };
  status?: {
    state: ModelAccessState;
    /** vLLM /v1 endpoint URL */
    endpoint?: string;
    /** API key — masked as •••••• in UI; full value used for copy-to-clipboard */
    apiKey?: string;
  };
}

export interface ModelAccessesListResponse {
  items: ModelAccess[];
}

// ---------------------------------------------------------------------------
// Subscription — tenant-admin resource (governs Consumer access to a model)
// ---------------------------------------------------------------------------

/**
 * A Subscription is the tenant-admin-owned governance unit for MaaS access.
 * It maps to the MaaS gateway stack:
 *   - groupAccess  -> Authorino group-based authentication
 *   - rateLimit    -> Limiter requests/minute enforcement
 *   - tokenQuota   -> monthly token ceiling
 *   - idpRef       -> tenant IDP reference used by Authorino for this subscription
 */
export type SubscriptionState = 'ACTIVE' | 'SUSPENDED';

export interface Subscription {
  id: string;
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    tenant?: string;
  };
  spec?: {
    /** ID of the ModelCatalogItem this subscription governs access to */
    modelCatalogItemId: string;
    /** Authorino group IDs allowed to consume this subscription */
    groupAccess: string[];
    /** Limiter requests/minute enforcement */
    rateLimit?: number;
    /** Monthly token ceiling across all consumers of this subscription */
    tokenQuota?: number;
    /** Tenant IDP reference used by Authorino for this subscription */
    idpRef?: string;
  };
  status?: {
    state: SubscriptionState;
    message?: string;
  };
}

export interface SubscriptionsListResponse {
  items: Subscription[];
}

// ---------------------------------------------------------------------------
// MaaS Token Usage — provider-admin metering resource (input/output/cache tokens)
// ---------------------------------------------------------------------------

export interface MaaSTokenUsage {
  id: string;
  tenantId: string;
  tenantName: string;
  subscriptionId: string;
  subscriptionName: string;
  period: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
}

export interface MaaSTokenUsageListResponse {
  items: MaaSTokenUsage[];
}

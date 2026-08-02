/**
 * @temp-api — Billing / Price Plan type definitions (REQ-BA-2..5)
 *
 * These interfaces describe the predicted composite billing architecture:
 * PricePlan holds per-meter rate overrides on top of BillableComponent base
 * rates declared on Templates; TenantSpec is extended with price_plan_ref /
 * affiliate_id / billing_model (stored as tenant labels until the proto adds
 * first-class fields).
 *
 * Hard gate: REQ-BA-3 (M360 vs Koku) must be decided before any of this ships
 * against a real backend. See architecture/koku.md and differentiators.md axis 2.
 *
 * When the real API ships:
 *  1. Replace these interfaces with generated proto types
 *  2. Remove @temp-api annotations from hook files
 *  3. Run `pnpm gen:api-diff` to reclassify from temp-api → real
 */

export type BillingModel = 'PAY_AS_YOU_GO' | 'PREPAID' | 'SUBSCRIPTION';

/** A single meter declared by a Template's BillableComponent block. */
export interface BillableComponent {
  /** e.g. 'vm-hours', 'network-egress-gb', 'storage-gb-month', 'gpu-hours' */
  meterKey: string;
  /** e.g. 'hour', 'gb', 'gb-month', 'token' */
  unit: string;
  /** Base rate in USD per unit — the provider's list price before plan overrides */
  baseRate: string;
  /** Optional reference to a NetworkClass / StorageBackend id for infra pass-through components */
  infraRef?: string;
}

// ---------------------------------------------------------------------------
// PricePlan — provider-admin resource
// ---------------------------------------------------------------------------

export interface PricePlan {
  id: string;
  metadata?: {
    name?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
  };
  title: string;
  description?: string;
  /** e.g. 'standard' | 'reseller' | 'gov' — informational grouping, not enforced */
  tier: string;
  isDefault?: boolean;
  /** meterKey -> USD override rate. Absent meters fall back to the template's baseRate. */
  rateOverrides: Record<string, string>;
}

export interface PricePlansListResponse {
  items: PricePlan[];
}

// ---------------------------------------------------------------------------
// Tenant billing fields — stored as labels on Tenant.metadata until the
// TenantSpec proto gains first-class price_plan_ref / affiliate_id / billing_model
// ---------------------------------------------------------------------------

export const TENANT_BILLING_LABEL_KEYS = {
  pricePlanRef: 'osac.io/price-plan-ref',
  affiliateId: 'osac.io/affiliate-id',
  billingModel: 'osac.io/billing-model',
} as const;

export interface TenantBillingInfo {
  pricePlanRef?: string;
  affiliateId?: string;
  billingModel?: BillingModel;
}

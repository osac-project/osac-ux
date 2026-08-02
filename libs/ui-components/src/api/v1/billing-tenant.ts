/**
 * @temp-api — Tenant billing assignment (REQ-BA-4)
 *
 * Extends the real v1/tenants resource with billing fields. TenantSpec has no
 * first-class price_plan_ref / affiliate_id / billing_model yet, so these are
 * stored as osac.io/* labels on Tenant.metadata — the same convention used for
 * price_per_hour on CatalogItems today.
 *
 * At order time, price_plan_ref + billing_model are snapshotted from the
 * tenant's current labels into immutable resource annotations (Price
 * Snapshotting — see BillingArchDiagram). organization_id is always resolved
 * server-side from the Keycloak JWT, never accepted from the client.
 *
 * Future migration:
 *  - Promote pricePlanRef / affiliateId / billingModel to first-class TenantSpec fields
 *  - Remove this @temp-api block once the proto ships
 */

import type { Tenant } from '@osac/types';

import {
  type BillingModel,
  TENANT_BILLING_LABEL_KEYS,
  type TenantBillingInfo,
} from './billing-types';
import { usePricePlan } from './price-plan';
import { usePatchTenant, useTenant } from './tenant';

export const readTenantBillingInfo = (tenant: Pick<Tenant, 'metadata'>): TenantBillingInfo => {
  const labels = (tenant.metadata as { labels?: Record<string, string> } | undefined)?.labels ?? {};
  return {
    pricePlanRef: labels[TENANT_BILLING_LABEL_KEYS.pricePlanRef] || undefined,
    affiliateId: labels[TENANT_BILLING_LABEL_KEYS.affiliateId] || undefined,
    billingModel: (labels[TENANT_BILLING_LABEL_KEYS.billingModel] as BillingModel) || undefined,
  };
};

/**
 * Patch a tenant's billing assignment. Only billing-admin-capable CSP Admins
 * should call this — Tenant Admins never see or edit these fields.
 */
export const usePatchTenantBilling = () => {
  const patchTenant = usePatchTenant();
  return {
    ...patchTenant,
    mutateAsync: ({
      id,
      tenant,
      billing,
    }: {
      id: string;
      tenant: Pick<Tenant, 'metadata' | 'spec'>;
      billing: TenantBillingInfo;
    }) => {
      const existingLabels =
        (tenant.metadata as { labels?: Record<string, string> } | undefined)?.labels ?? {};
      const labels: Record<string, string> = { ...existingLabels };
      if (billing.pricePlanRef) {
        labels[TENANT_BILLING_LABEL_KEYS.pricePlanRef] = billing.pricePlanRef;
      } else {
        delete labels[TENANT_BILLING_LABEL_KEYS.pricePlanRef];
      }
      if (billing.affiliateId) {
        labels[TENANT_BILLING_LABEL_KEYS.affiliateId] = billing.affiliateId;
      } else {
        delete labels[TENANT_BILLING_LABEL_KEYS.affiliateId];
      }
      if (billing.billingModel) {
        labels[TENANT_BILLING_LABEL_KEYS.billingModel] = billing.billingModel;
      } else {
        delete labels[TENANT_BILLING_LABEL_KEYS.billingModel];
      }
      return patchTenant.mutateAsync({
        id,
        patch: {
          spec: tenant.spec,
          metadata: { ...tenant.metadata, labels },
        } as unknown as Partial<Pick<Tenant, 'metadata' | 'spec'>>,
      });
    },
  };
};

/**
 * Resolves a tenant's assigned PricePlan rate overrides, if any. Used to snapshot
 * an effective price onto CatalogItems when a Tenant Admin combines a Template
 * (see TenantCombineTemplatePage) and to price-break-down provisioning wizards.
 */
export const useTenantRateOverrides = (tenantId: string | undefined) => {
  const { data: tenant, isLoading: tenantLoading } = useTenant(tenantId ?? '');
  const billing = tenant ? readTenantBillingInfo(tenant) : {};
  const { data: pricePlan, isLoading: planLoading } = usePricePlan(billing.pricePlanRef);
  return {
    rateOverrides: pricePlan?.rateOverrides,
    pricePlan,
    isLoading: Boolean(tenantId) && (tenantLoading || planLoading),
  };
};

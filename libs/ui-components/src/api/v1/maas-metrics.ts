/**
 * @temp-api — MaaS Token Usage hooks (OSAC-MaaS)
 *
 * These hooks front the predicted v1/maas_token_usage API endpoint.
 * No fulfillment-service backend exists yet — all data comes from mock-store.ts.
 *
 * Read-only, provider-admin scoped metering view (input/output/cache tokens
 * per tenant/subscription/period), sourced from OTel + CoP per the MaaS
 * integration meeting signals (low-latency gateway metering plugin).
 *
 * Future migration:
 *  - Replace MaaSTokenUsage / MaaSTokenUsageListResponse imports with generated proto types
 *  - Remove this @temp-api block
 *  - Run `pnpm gen:api-diff` to reclassify this route as 'real'
 */

import { useApiQuery } from '../use-api-query';
import type { MaaSTokenUsage, MaaSTokenUsageListResponse } from './maas-types';

export const useMaaSTokenUsage = () =>
  useApiQuery<MaaSTokenUsageListResponse, MaaSTokenUsage[]>({
    queryKey: ['v1/maas_token_usage', null],
    select: (data) => data.items,
  });

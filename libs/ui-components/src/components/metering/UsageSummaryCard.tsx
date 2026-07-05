/**
 * UsageSummaryCard — Estimated monthly usage card for tenant and provider dashboards.
 *
 * @temp-api (OSAC-985, Milestone 0.3)
 * Metering data is not yet produced by a live service. This component uses mock data
 * via fetchMeteringUsage({ demo: true }).
 *
 * Milestone 0.3: metering data collection only.
 * Milestone 0.4: costing / billing / quota enforcement (deferred).
 *
 * Charge formula: estimatedCost = uptimeSeconds × (pricePerHour / 3600)
 */
import React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  type MeteringResourceEntry,
  type MeteringUsageSummary,
  fetchMeteringUsage,
} from '../../api/metering/usage';

const formatUptime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}h`;
  }
  return `${(seconds / 86400).toFixed(1)}d`;
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  compute_instance: 'VM',
  cluster: 'Cluster',
  baremetal_instance: 'Bare Metal',
  model_access: 'AI Model',
};

const isMaaSEntry = (
  r: MeteringResourceEntry,
): r is Extract<MeteringResourceEntry, { resourceType: 'model_access' }> =>
  r.resourceType === 'model_access';

interface UsageSummaryCardProps {
  tenantId?: string;
  period?: 'current_month' | 'last_month';
}

export const UsageSummaryCard = ({ tenantId, period = 'current_month' }: UsageSummaryCardProps) => {
  const [usage, setUsage] = React.useState<MeteringUsageSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMeteringUsage({ demo: true, tenantId, period })
      .then(setUsage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load usage'))
      .finally(() => setIsLoading(false));
  }, [tenantId, period]);

  return (
    <Card>
      <CardTitle>
        <Stack>
          <StackItem>
            Estimated Usage — {period === 'current_month' ? 'Current Month' : 'Last Month'}
          </StackItem>
          <StackItem>
            <Label isCompact color="yellow" variant="outline">
              Estimated — billing not yet active (Milestone 0.3)
            </Label>
          </StackItem>
        </Stack>
      </CardTitle>
      <CardBody>
        {isLoading && <Skeleton width="200px" screenreaderText="Loading usage summary" />}
        {error && <span style={{ color: 'var(--pf-t--color--red--40)' }}>{error}</span>}
        {usage && (
          <Stack hasGutter>
            <StackItem>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Total estimated cost</DescriptionListTerm>
                  <DescriptionListDescription>
                    <strong>
                      ${usage.totalEstimatedCost.toFixed(4)} {usage.currency}
                    </strong>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Active resources</DescriptionListTerm>
                  <DescriptionListDescription>{usage.resources.length}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>

            {usage.resources.length > 0 && (
              <StackItem>
                <Table aria-label="Usage breakdown" variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Resource</Th>
                      <Th>Type</Th>
                      <Th>Class / Model</Th>
                      <Th>Uptime / Tokens</Th>
                      <Th>Rate</Th>
                      <Th>Est. cost</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {usage.resources.map((r) => (
                      <Tr key={r.resourceId}>
                        <Td dataLabel="Resource">
                          <strong>{r.resourceName}</strong>
                        </Td>
                        <Td dataLabel="Type">
                          <Label isCompact color={isMaaSEntry(r) ? 'teal' : 'blue'}>
                            {RESOURCE_TYPE_LABELS[r.resourceType] ?? r.resourceType}
                          </Label>
                        </Td>
                        <Td dataLabel="Class / Model">
                          {isMaaSEntry(r) ? r.modelName : r.resourceClass}
                        </Td>
                        <Td dataLabel="Uptime / Tokens">
                          {isMaaSEntry(r)
                            ? `${(r.inputTokens + r.outputTokens).toLocaleString()} tokens`
                            : formatUptime(r.uptimeSeconds)}
                        </Td>
                        <Td dataLabel="Rate">
                          {isMaaSEntry(r)
                            ? `$${(r.pricePerInputToken * 1_000_000).toFixed(2)}/1M in`
                            : `$${r.pricePerHour.toFixed(2)}/hr`}
                        </Td>
                        <Td dataLabel="Est. cost">
                          <strong>${r.estimatedCost.toFixed(4)}</strong>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </StackItem>
            )}

            <StackItem>
              <span style={{ fontSize: '0.8em', color: 'var(--pf-t--global--color--200)' }}>
                Metering source: instance-type-seconds (VMs) · host-type-seconds (clusters/BM) ·
                BMaaS / storage / networking metering deferred. Cost = uptime × ($/hr ÷ 3600).
              </span>
            </StackItem>
          </Stack>
        )}
      </CardBody>
    </Card>
  );
};

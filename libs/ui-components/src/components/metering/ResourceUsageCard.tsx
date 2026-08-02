/**
 * ResourceUsageCard — Per-resource estimated usage widget for VM/Cluster/MaaS detail pages.
 *
 * @temp-api (OSAC-985, Milestone 0.3). Scopes fetchMeteringUsage() to a single resourceId.
 * Milestone 0.4: costing / billing / quota enforcement (deferred).
 */
import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Skeleton,
} from '@patternfly/react-core';

import { type MeteringResourceEntry, fetchMeteringUsage } from '../../api/metering/usage';
import { useTranslation } from '../../hooks/useTranslation';

const formatUptime = (seconds: number): string => {
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}h`;
  }
  return `${(seconds / 86400).toFixed(1)}d`;
};

const isMaaSEntry = (
  r: MeteringResourceEntry,
): r is Extract<MeteringResourceEntry, { resourceType: 'model_access' }> =>
  r.resourceType === 'model_access';

interface ResourceUsageCardProps {
  resourceId: string;
  tenantId?: string;
  period?: 'current_month' | 'last_month';
  title?: string;
}

export const ResourceUsageCard = ({
  resourceId,
  tenantId,
  period = 'current_month',
  title,
}: ResourceUsageCardProps) => {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<MeteringResourceEntry | null | undefined>(undefined);

  useEffect(() => {
    setEntry(undefined);
    fetchMeteringUsage({ demo: true, tenantId, resourceId, period })
      .then((summary) => setEntry(summary.resources[0] ?? null))
      .catch(() => setEntry(null));
  }, [resourceId, tenantId, period]);

  return (
    <Card isFullHeight>
      <CardTitle>{title ?? t('Usage & estimated cost')}</CardTitle>
      <CardBody>
        {entry === undefined && (
          <Skeleton width="200px" screenreaderText={t('Loading resource usage')} />
        )}
        {entry === null && (
          <Alert variant="info" isInline isPlain title={t('No usage recorded yet this period')} />
        )}
        {entry && (
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>
                {isMaaSEntry(entry) ? t('Tokens consumed') : t('Uptime')}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {isMaaSEntry(entry)
                  ? `${(entry.inputTokens + entry.outputTokens + entry.cachedTokens).toLocaleString()} tokens`
                  : formatUptime(entry.uptimeSeconds)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Rate')}</DescriptionListTerm>
              <DescriptionListDescription>
                {isMaaSEntry(entry)
                  ? `$${(entry.pricePerInputToken * 1_000_000).toFixed(2)} / 1M input tokens`
                  : `$${entry.pricePerHour.toFixed(2)} / hr`}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Estimated cost this period')}</DescriptionListTerm>
              <DescriptionListDescription>
                <strong>${entry.estimatedCost.toFixed(4)}</strong>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm> </DescriptionListTerm>
              <DescriptionListDescription>
                <Label isCompact color="yellow" variant="outline">
                  {t('Estimated — billing not yet active (Milestone 0.3)')}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        )}
      </CardBody>
    </Card>
  );
};

export default ResourceUsageCard;

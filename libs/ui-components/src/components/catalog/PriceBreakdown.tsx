import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';

import type { BillableComponent } from '../../api/v1/billing-types';
import { effectiveComponentRate, totalHourlyRate } from '../../api/v1/template-billing';
import { useTranslation } from '../../hooks/useTranslation';

interface PriceBreakdownProps {
  components: BillableComponent[];
  rateOverrides?: Record<string, string>;
  title?: string;
}

/** Human-friendly label for a meterKey, e.g. 'vm-hours' -> 'VM hours'. */
const meterLabel = (meterKey: string): string =>
  meterKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/** Token rates are tiny (e.g. $0.000002/token) — display as $/1M tokens instead. */
const formatRate = (rate: number, unit: string): string =>
  unit === 'token' ? `$${(rate * 1_000_000).toFixed(2)}/1M tokens` : `$${rate.toFixed(4)}/${unit}`;

/**
 * Itemized rate breakdown per BillableComponent, with a rolled-up hourly total.
 * Used in provisioning wizard review steps (VM/Cluster/Bare metal) so users see
 * exactly which meters drive the estimated cost, not just a single total.
 */
export const PriceBreakdown = ({ components, rateOverrides, title }: PriceBreakdownProps) => {
  const { t } = useTranslation();
  if (components.length === 0) {
    return null;
  }

  const hourly = totalHourlyRate(components, rateOverrides);

  return (
    <Alert variant="info" isInline title={title ?? t('Estimated cost (continuous 24/7 usage)')}>
      <DescriptionList isCompact isHorizontal>
        {components.map((component) => {
          const rate = effectiveComponentRate(component, rateOverrides);
          const isOverridden = Boolean(
            rateOverrides?.[component.meterKey] &&
            rateOverrides[component.meterKey] !== component.baseRate,
          );
          return (
            <DescriptionListGroup key={component.meterKey}>
              <DescriptionListTerm>{meterLabel(component.meterKey)}</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex
                  spaceItems={{ default: 'spaceItemsSm' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                >
                  <FlexItem>{formatRate(rate, component.unit)}</FlexItem>
                  {isOverridden && (
                    <FlexItem>
                      <Label isCompact color="purple" variant="outline">
                        {t('plan rate')}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
          );
        })}
      </DescriptionList>
      {hourly > 0 && (
        <>
          <Divider style={{ margin: '0.5rem 0' }} />
          <Flex gap={{ default: 'gapMd' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem>
              <Content component="small">{t('Hourly')}</Content>
              <Label variant="filled" color="blue" isCompact style={{ marginLeft: '0.4rem' }}>
                ${hourly.toFixed(2)}/hr
              </Label>
            </FlexItem>
            <FlexItem>
              <Content component="small">{t('Monthly')}</Content>
              <Label variant="filled" color="blue" isCompact style={{ marginLeft: '0.4rem' }}>
                ${(hourly * 730).toFixed(0)}/mo
              </Label>
            </FlexItem>
          </Flex>
        </>
      )}
    </Alert>
  );
};

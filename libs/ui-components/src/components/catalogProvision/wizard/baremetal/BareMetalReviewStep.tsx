import { useMemo } from 'react';
import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { BareMetalInstanceCatalogItem } from '@osac/types';

import {
  BM_RUN_STRATEGY_ALWAYS,
  BM_RUN_STRATEGY_HALTED,
  type BareMetalWizardValues,
} from './fields';
import { readBillableComponents } from '../../../../api/v1/template-billing';
import { useTranslation } from '../../../../hooks/useTranslation';
import { PriceBreakdown } from '../../../catalog/PriceBreakdown';

interface Props {
  values: BareMetalWizardValues;
  catalogItem: BareMetalInstanceCatalogItem | null;
  provisionError?: string;
}

const runStrategyLabelKey = (strategy: number): string => {
  if (strategy === BM_RUN_STRATEGY_ALWAYS) {
    return 'catalogProvision.baremetal.runStrategy.always';
  }
  if (strategy === BM_RUN_STRATEGY_HALTED) {
    return 'catalogProvision.baremetal.runStrategy.halted';
  }
  return String(strategy);
};

export const BareMetalReviewStep = ({ values, catalogItem, provisionError }: Props) => {
  const { t } = useTranslation();
  const pricePerHour = catalogItem?.metadata?.labels?.['price_per_hour'];
  const billableComponents = useMemo(
    () =>
      catalogItem
        ? readBillableComponents(
            catalogItem as unknown as { metadata?: { annotations?: Record<string, string> } },
          )
        : [],
    [catalogItem],
  );

  return (
    <Stack hasGutter>
      {provisionError && (
        <StackItem>
          <Alert
            variant="danger"
            isInline
            title={t('catalogProvision.baremetal.review.provisionErrorTitle')}
          >
            {provisionError}
          </Alert>
        </StackItem>
      )}

      {billableComponents.length > 0 ? (
        <StackItem>
          <PriceBreakdown components={billableComponents} />
        </StackItem>
      ) : (
        pricePerHour && (
          <StackItem>
            <Alert variant="info" isInline title={t('Estimated cost (continuous 24/7 usage)')}>
              <Label variant="filled" color="blue" isCompact>
                ${pricePerHour}/hr
              </Label>{' '}
              <Content component="small">{t('catalogProvision.review.meteringEstimate')}</Content>
            </Alert>
          </StackItem>
        )
      )}

      {/* ── Catalog ───────────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.steps.catalog.title')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('catalogProvision.review.catalogItem')}</DescriptionListTerm>
            <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          {catalogItem?.description && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('catalogProvision.review.description')}</DescriptionListTerm>
              <DescriptionListDescription>{catalogItem.description}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </StackItem>

      {/* ── General ───────────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.steps.general.title')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('catalogProvision.baremetal.fields.name')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{values.name}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.baremetal.fields.runStrategy')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {t(runStrategyLabelKey(values.runStrategy))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {/* ── Configuration ─────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.steps.configuration.title')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.baremetal.fields.sshKey')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {values.sshPublicKey.trim() ? (
                <Label isCompact color="green">
                  {t('catalogProvision.review.provided')}
                </Label>
              ) : (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {t('catalogProvision.review.notSet')}
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.baremetal.fields.userData')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {values.userData.trim() ? (
                <Label isCompact color="green">
                  {t('catalogProvision.review.provided')}
                </Label>
              ) : (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {t('catalogProvision.review.notSet')}
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

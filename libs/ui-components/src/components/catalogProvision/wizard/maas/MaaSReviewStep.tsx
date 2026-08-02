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

import type { MaaSWizardValues } from './fields';
import type { ModelCatalogItem } from '../../../../api/v1/maas-types';
import { readBillableComponents } from '../../../../api/v1/template-billing';
import { useTranslation } from '../../../../hooks/useTranslation';
import { PriceBreakdown } from '../../../catalog/PriceBreakdown';

interface Props {
  values: MaaSWizardValues;
  catalogItem: ModelCatalogItem | null;
  provisionError?: string;
}

export const MaaSReviewStep = ({ values, catalogItem, provisionError }: Props) => {
  const { t } = useTranslation();
  const billableComponents = useMemo(
    () =>
      catalogItem
        ? readBillableComponents(
            catalogItem as unknown as { metadata?: { annotations?: Record<string, string> } },
          )
        : [],
    [catalogItem],
  );

  // Legacy fallback for items created before the BillableComponent migration.
  const legacyPriceDisplay = (() => {
    if (billableComponents.length > 0) {
      return undefined;
    }
    const input = catalogItem?.metadata?.labels?.['price_per_input_token'];
    const output = catalogItem?.metadata?.labels?.['price_per_output_token'];
    if (input && output) {
      return t('catalogProvision.maas.review.legacyPriceInOut', {
        input: (parseFloat(input) * 1_000_000).toFixed(2),
        output: (parseFloat(output) * 1_000_000).toFixed(2),
      });
    }
    if (input) {
      return t('catalogProvision.maas.review.legacyPriceInputOnly', {
        input: (parseFloat(input) * 1_000_000).toFixed(2),
      });
    }
    return undefined;
  })();

  const modelProvider = catalogItem?.metadata?.labels?.['model_provider'];
  const contextWindow = catalogItem?.metadata?.labels?.['context_window'];

  return (
    <Stack hasGutter>
      {provisionError && (
        <StackItem>
          <Alert
            variant="danger"
            isInline
            title={t('catalogProvision.maas.review.provisionErrorTitle')}
          >
            {provisionError}
          </Alert>
        </StackItem>
      )}

      {billableComponents.length > 0 ? (
        <StackItem>
          <PriceBreakdown
            components={billableComponents}
            title={t('catalogProvision.maas.review.costEstimateTitle')}
          />
        </StackItem>
      ) : (
        legacyPriceDisplay && (
          <StackItem>
            <Alert variant="info" isInline title={t('catalogProvision.maas.review.estimatedCost')}>
              <Label variant="filled" color="blue" isCompact>
                {legacyPriceDisplay}
              </Label>
            </Alert>
          </StackItem>
        )
      )}

      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.maas.review.modelSectionTitle')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('catalogProvision.maas.fields.model')}</DescriptionListTerm>
            <DescriptionListDescription>
              <strong>{catalogItem?.title ?? '—'}</strong>
              {catalogItem?.description && (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {' '}
                  — {catalogItem.description}
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {modelProvider && (
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t('catalogProvision.maas.fields.provider')}
              </DescriptionListTerm>
              <DescriptionListDescription>
                <Label isCompact color="grey">
                  {modelProvider}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {contextWindow && (
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t('catalogProvision.maas.fields.contextWindow')}
              </DescriptionListTerm>
              <DescriptionListDescription>{contextWindow}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </StackItem>

      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.steps.configuration.title')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.maas.fields.applicationName')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <code>{values.applicationName}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.maas.fields.tokenQuota')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {values.tokenQuotaMonthly.toLocaleString()}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

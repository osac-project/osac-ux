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

import type { ClusterCatalogItem, ClusterTemplate } from '@osac/types';

import { type ClusterWizardValues, DEFAULT_POD_CIDR, DEFAULT_SERVICE_CIDR } from './fields';
import { clusterTemplateNodeSetsSummary } from '../../../../api/v1/cluster-templates';
import { readBillableComponents } from '../../../../api/v1/template-billing';
import { useTranslation } from '../../../../hooks/useTranslation';
import { PriceBreakdown } from '../../../catalog/PriceBreakdown';

interface Props {
  values: ClusterWizardValues;
  catalogItem: ClusterCatalogItem | null;
  template: ClusterTemplate | undefined;
  provisionError?: string;
}

export const ClusterReviewStep = ({ values, catalogItem, template, provisionError }: Props) => {
  const { t } = useTranslation();
  const podCidr =
    values.podCidr.trim() || template?.specDefaults?.network?.podCidr || DEFAULT_POD_CIDR;
  const serviceCidr =
    values.serviceCidr.trim() ||
    template?.specDefaults?.network?.serviceCidr ||
    DEFAULT_SERVICE_CIDR;

  const paramEntries = Object.entries(values.templateParameters).filter(
    ([, v]) => v.trim().length > 0,
  );

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
            title={t('catalogProvision.cluster.review.provisionErrorTitle')}
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
          {template && (
            <DescriptionListGroup>
              <DescriptionListTerm>
                {t('catalogProvision.cluster.fields.nodeSets')}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {clusterTemplateNodeSetsSummary(template)}
              </DescriptionListDescription>
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
            <DescriptionListTerm>{t('catalogProvision.cluster.fields.name')}</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{values.name}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.cluster.fields.pullSecret')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {values.pullSecret.trim() ? (
                <Label isCompact color="green">
                  {t('catalogProvision.review.provided')}
                </Label>
              ) : (
                <Label isCompact color="orange">
                  {t('catalogProvision.review.notSet')}
                </Label>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('catalogProvision.cluster.fields.sshKey')}</DescriptionListTerm>
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
        </DescriptionList>
      </StackItem>

      {/* ── Configuration ─────────────────────────────────────── */}
      {(values.releaseImage.trim() || paramEntries.length > 0) && (
        <>
          <StackItem>
            <Title headingLevel="h3" size="md">
              {t('catalogProvision.steps.configuration.title')}
            </Title>
          </StackItem>
          <StackItem>
            <DescriptionList isHorizontal isCompact>
              {values.releaseImage.trim() && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t('catalogProvision.cluster.fields.releaseImage')}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{values.releaseImage}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {paramEntries.map(([name, value]) => {
                const paramDef = template?.parameters.find((p) => p.name === name);
                return (
                  <DescriptionListGroup key={name}>
                    <DescriptionListTerm>{paramDef?.title || name}</DescriptionListTerm>
                    <DescriptionListDescription>{value}</DescriptionListDescription>
                  </DescriptionListGroup>
                );
              })}
            </DescriptionList>
          </StackItem>
        </>
      )}

      {/* ── Networking ────────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('catalogProvision.steps.networking.title')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.cluster.fields.podCidr')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <code>{podCidr}</code>
              {!values.podCidr.trim() && (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {' '}
                  {t('catalogProvision.review.defaultSuffix')}
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t('catalogProvision.cluster.fields.serviceCidr')}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <code>{serviceCidr}</code>
              {!values.serviceCidr.trim() && (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {' '}
                  {t('catalogProvision.review.defaultSuffix')}
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

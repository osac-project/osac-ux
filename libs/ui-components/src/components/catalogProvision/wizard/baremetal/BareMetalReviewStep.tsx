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

interface Props {
  values: BareMetalWizardValues;
  catalogItem: BareMetalInstanceCatalogItem | null;
  provisionError?: string;
}

const runStrategyLabel = (strategy: number): string => {
  if (strategy === BM_RUN_STRATEGY_ALWAYS) {
    return 'Always (start immediately)';
  }
  if (strategy === BM_RUN_STRATEGY_HALTED) {
    return 'Halted (start stopped)';
  }
  return String(strategy);
};

export const BareMetalReviewStep = ({ values, catalogItem, provisionError }: Props) => {
  const pricePerHour = catalogItem?.metadata?.labels?.['price_per_hour'];

  return (
    <Stack hasGutter>
      {provisionError && (
        <StackItem>
          <Alert variant="danger" isInline title="Failed to create bare metal instance">
            {provisionError}
          </Alert>
        </StackItem>
      )}

      {pricePerHour && (
        <StackItem>
          <Alert variant="info" isInline title="Estimated cost (continuous 24/7 usage)">
            <Label variant="filled" color="blue" isCompact>
              ${pricePerHour}/hr
            </Label>{' '}
            <Content component="small">Metering estimate</Content>
          </Alert>
        </StackItem>
      )}

      {/* ── Catalog ───────────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          Catalog
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Catalog item</DescriptionListTerm>
            <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          {catalogItem?.description && (
            <DescriptionListGroup>
              <DescriptionListTerm>Description</DescriptionListTerm>
              <DescriptionListDescription>{catalogItem.description}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </StackItem>

      {/* ── General ───────────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          General
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Instance name</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{values.name}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Run strategy</DescriptionListTerm>
            <DescriptionListDescription>
              {runStrategyLabel(values.runStrategy)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      {/* ── Configuration ─────────────────────────────────────── */}
      <StackItem>
        <Title headingLevel="h3" size="md">
          Configuration
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>SSH public key</DescriptionListTerm>
            <DescriptionListDescription>
              {values.sshPublicKey.trim() ? (
                <Label isCompact color="green">
                  Provided
                </Label>
              ) : (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  Not set
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>User data</DescriptionListTerm>
            <DescriptionListDescription>
              {values.userData.trim() ? (
                <Label isCompact color="green">
                  Provided
                </Label>
              ) : (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  Not set
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

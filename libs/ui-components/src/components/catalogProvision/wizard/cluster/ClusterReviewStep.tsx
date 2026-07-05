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

interface Props {
  values: ClusterWizardValues;
  catalogItem: ClusterCatalogItem | null;
  template: ClusterTemplate | undefined;
  provisionError?: string;
}

export const ClusterReviewStep = ({ values, catalogItem, template, provisionError }: Props) => {
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

  return (
    <Stack hasGutter>
      {provisionError && (
        <StackItem>
          <Alert variant="danger" isInline title="Failed to create cluster">
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
          {template && (
            <DescriptionListGroup>
              <DescriptionListTerm>Node sets</DescriptionListTerm>
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
          General
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster name</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{values.name}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Pull secret</DescriptionListTerm>
            <DescriptionListDescription>
              {values.pullSecret.trim() ? (
                <Label isCompact color="green">
                  Provided
                </Label>
              ) : (
                <Label isCompact color="orange">
                  Not set
                </Label>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
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
        </DescriptionList>
      </StackItem>

      {/* ── Configuration ─────────────────────────────────────── */}
      {(values.releaseImage.trim() || paramEntries.length > 0) && (
        <>
          <StackItem>
            <Title headingLevel="h3" size="md">
              Configuration
            </Title>
          </StackItem>
          <StackItem>
            <DescriptionList isHorizontal isCompact>
              {values.releaseImage.trim() && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Release image</DescriptionListTerm>
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
          Networking
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Pod CIDR</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{podCidr}</code>
              {!values.podCidr.trim() && (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {' '}
                  (default)
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Service CIDR</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{serviceCidr}</code>
              {!values.serviceCidr.trim() && (
                <Content component="small" className="pf-v6-u-color-text-subtle">
                  {' '}
                  (default)
                </Content>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

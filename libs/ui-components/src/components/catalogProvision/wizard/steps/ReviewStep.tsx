import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { instanceTypePricePerHour, useInstanceTypes } from '../../../../api/v1/instance-types';
import { usePublicIPPools } from '../../../../api/v1/ip-management';
import {
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../../../api/v1/networking';
import { useTranslation } from '../../../../hooks/useTranslation';
import { catalogItemPrice } from '../../../catalog/catalogItemDisplay';
import type { CatalogItemForDisplay } from '../../../catalog/catalogItemDisplay';
import type { ComputeInstanceWizardValues } from '../adapters/computeInstance/fields';
import type { CatalogProvisionAdapter } from '../adapters/types';

interface Props {
  adapter: CatalogProvisionAdapter<
    ComputeInstanceCatalogItem,
    ComputeInstanceWizardValues,
    BuildComputeInstanceCreateBodyInput
  >;
  catalogItem: ComputeInstanceCatalogItem | null;
  values: ComputeInstanceWizardValues;
}

export const ReviewStep = ({ adapter, catalogItem, values }: Props) => {
  const { t } = useTranslation();
  const virtualNetworkId = values.spec.networking.virtualNetworkId;
  const subnetFilter = virtualNetworkId
    ? virtualNetworkFilterForSubnetList(virtualNetworkId)
    : undefined;
  const securityGroupFilter = subnetFilter;
  const { data: virtualNetworks = [] } = useVirtualNetworks();
  const { data: subnets = [] } = useSubnets(subnetFilter ? { filter: subnetFilter } : {}, {
    enabled: Boolean(virtualNetworkId),
  });
  const { data: securityGroups = [] } = useSecurityGroups(
    securityGroupFilter ? { filter: securityGroupFilter } : {},
    { enabled: Boolean(virtualNetworkId) },
  );
  const { data: instanceTypes = [] } = useInstanceTypes();
  const { data: publicIPPools = [] } = usePublicIPPools();

  // ── Cost estimation ──────────────────────────────────────────────
  const selectedInstanceType = instanceTypes.find((it) => it.id === values.spec.instanceType);
  const rawItemPrice = catalogItemPrice(catalogItem as unknown as CatalogItemForDisplay);
  const itemHourly = rawItemPrice ? parseFloat(rawItemPrice.replace(/[^0-9.]/g, '')) : 0;
  const itHourly = selectedInstanceType ? (instanceTypePricePerHour(selectedInstanceType) ?? 0) : 0;
  const hourly = itemHourly + itHourly;
  const monthly = hourly * 730;
  const yearly = hourly * 8760;
  const showCost = hourly > 0;

  const sections = catalogItem
    ? adapter.getReviewSections(values, catalogItem, {
        securityGroups,
        instanceTypes,
        virtualNetworks,
        subnets,
        publicIPPools,
      })
    : [];
  const rows = sections.flatMap((section) => section.rows);

  return (
    <>
      {showCost && (
        <Alert
          variant="info"
          isInline
          title={t('Estimated cost (continuous 24/7 usage)')}
          style={{ marginBottom: '1rem' }}
        >
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
                ${monthly.toFixed(0)}/mo
              </Label>
            </FlexItem>
            <FlexItem>
              <Content component="small">{t('Yearly')}</Content>
              <Label variant="filled" color="blue" isCompact style={{ marginLeft: '0.4rem' }}>
                ${yearly.toFixed(0)}/yr
              </Label>
            </FlexItem>
          </Flex>
        </Alert>
      )}
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('catalogProvision.review.catalogItem')}</DescriptionListTerm>
          <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
        </DescriptionListGroup>
        {rows.map((row) => (
          <DescriptionListGroup key={row.label}>
            <DescriptionListTerm>{row.label}</DescriptionListTerm>
            <DescriptionListDescription>{row.value}</DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
    </>
  );
};

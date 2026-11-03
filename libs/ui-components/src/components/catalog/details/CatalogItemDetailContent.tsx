import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type {
  ComputeInstanceDisk,
  DiskImageReference,
  InstanceTypeReference,
  StorageTierReference,
} from '@osac/types';

import { CatalogFieldEditabilityLabel } from './CatalogFieldEditabilityLabel.tsx';
import { useTranslation } from '../../../hooks/useTranslation.ts';
import { SubtleContent } from '../../SubtleContent/SubtleContent.tsx';
import {
  type CatalogItem,
  catalogItemConfigurationFieldDefinitions,
  catalogItemMetadataLabelEntries,
  catalogItemResourceParts,
  formatCatalogFieldDefault,
} from '../catalogItemDisplay.ts';

interface CatalogItemDetailContentProps {
  item: CatalogItem;
}

const policyValue = <T,>(policy: unknown): T | undefined => {
  if (!policy || typeof policy !== 'object' || !('behavior' in policy)) {
    return undefined;
  }
  const behavior = (policy as { behavior?: { case?: string; value?: unknown } }).behavior;
  if (!behavior) {
    return undefined;
  }
  if (behavior.case === 'locked') {
    return behavior.value as T | undefined;
  }
  if (behavior.case === 'editable') {
    const value = behavior.value as { defaultValue?: T } | undefined;
    return value?.defaultValue;
  }
  return undefined;
};

const referenceLabel = (reference: { id: string; name: string } | undefined): string =>
  reference ? `${reference.name || '—'} (${reference.id || '—'})` : '—';

const computeHardwareDetails = (item: CatalogItem): Array<{ label: string; value: string }> => {
  if (item.$typeName !== 'osac.public.v1.ComputeInstanceCatalogItem') {
    return [];
  }
  const fields = item.fields;
  const instanceType = policyValue<InstanceTypeReference>(fields?.instanceType);
  const diskImage = policyValue<DiskImageReference>(fields?.diskImage);
  const bootSize = policyValue<number>(fields?.bootDisk?.sizeGib);
  const bootTier = policyValue<StorageTierReference>(fields?.bootDisk?.storageTier);
  const additionalDisks = policyValue<{ items: ComputeInstanceDisk[] }>(fields?.additionalDisks);
  const userData = policyValue<string>(fields?.userData);

  return [
    ...(instanceType ? [{ label: 'Instance type', value: referenceLabel(instanceType) }] : []),
    ...(diskImage ? [{ label: 'Disk image', value: referenceLabel(diskImage) }] : []),
    ...(bootSize !== undefined ? [{ label: 'Boot disk size', value: `${bootSize} GiB` }] : []),
    ...(bootTier ? [{ label: 'Boot disk tier', value: referenceLabel(bootTier) }] : []),
    ...(additionalDisks
      ? [{ label: 'Additional disks', value: `${additionalDisks.items.length}` }]
      : []),
    ...(userData !== undefined
      ? [{ label: 'User data', value: userData.trim() ? 'Configured' : 'Not configured' }]
      : []),
  ];
};

export const CatalogItemDetailContent = ({ item }: CatalogItemDetailContentProps) => {
  const { t } = useTranslation();
  const resources = catalogItemResourceParts(item);
  const metadataLabels = catalogItemMetadataLabelEntries(item);
  const configurationFields = catalogItemConfigurationFieldDefinitions(item);
  const hardwareDetails = computeHardwareDetails(item);
  const description = item.description?.trim();

  return (
    <Stack hasGutter>
      <StackItem>
        <Card>
          <CardTitle>{t('Details')}</CardTitle>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Catalog name')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {item.metadata?.name ?? '—'}
                </DescriptionListDescription>
              </DescriptionListGroup>

              {description ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
                  <DescriptionListDescription>{description}</DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}

              {item.template ? (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Provisioning template')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {item.template.name || '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Provisioning template ID')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {item.template.id || '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              ) : null}

              {resources.length > 0 ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Default resources')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
                      {resources.map((resource, index) => (
                        <FlexItem key={`${item.id}-detail-resource-${index}`}>
                          <Label variant="outline" color="blue" isCompact>
                            {resource}
                          </Label>
                        </FlexItem>
                      ))}
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}

              {metadataLabels.length > 0 ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
                      {metadataLabels.map(({ key, value }) => (
                        <FlexItem key={`${item.id}-detail-label-${key}`}>
                          <Label variant="outline" color="grey" isCompact>
                            <b>{key}</b>
                            {': '}
                            {value}
                          </Label>
                        </FlexItem>
                      ))}
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}
            </DescriptionList>
          </CardBody>
        </Card>
      </StackItem>

      {hardwareDetails.length > 0 ? (
        <StackItem>
          <Card>
            <CardTitle>{t('Hardware specifications')}</CardTitle>
            <CardBody>
              <DescriptionList isHorizontal>
                {hardwareDetails.map(({ label, value }) => (
                  <DescriptionListGroup key={label}>
                    <DescriptionListTerm>{t(label)}</DescriptionListTerm>
                    <DescriptionListDescription>{value}</DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>
      ) : null}

      {configurationFields.length > 0 ? (
        <StackItem>
          <Card>
            <CardTitle>{t('Configuration defaults')}</CardTitle>
            <CardBody>
              <Stack hasGutter>
                <StackItem>
                  <SubtleContent component="p">
                    {t(
                      'Editable fields can be changed when creating from this catalog item. Fixed fields use the default value shown.',
                    )}
                  </SubtleContent>
                </StackItem>
                <StackItem>
                  <DescriptionList isHorizontal>
                    {configurationFields.map((def) => (
                      <DescriptionListGroup key={def.path}>
                        <DescriptionListTerm>
                          {def.displayName} <CatalogFieldEditabilityLabel editable={def.editable} />
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatCatalogFieldDefault(def)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ))}
                  </DescriptionList>
                </StackItem>
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      ) : null}
    </Stack>
  );
};

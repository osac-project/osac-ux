import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import {
  type ReviewSection,
  formatBootDiskSizeForReview,
  formatReviewScalar,
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
  reviewRow,
} from '../catalogOverlay';
import { applyVmCatalogConfigurationDefaults } from './computeInstance/applyCatalogDefaults';
import { applyVmCatalogGeneralDefaults } from './computeInstance/applyCatalogGeneralDefaults';
import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import { buildVmGeneralFields } from './computeInstance/generalFields';
import {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';
import { buildComputeInstanceStepSchema } from './computeInstance/schemas';
import { VmConfigurationStep } from './computeInstance/VmConfigurationStep';
import { VmGeneralExtStep } from './computeInstance/VmGeneralExtStep';
import { VmNetworkingStep } from './computeInstance/VmNetworkingStep';
import type { CatalogProvisionAdapter, ReviewContext } from './types';
import { useComputeInstanceCatalogItems } from '../../../../api/v1/compute-instance-catalog-item';
import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { formatInstanceTypeReviewLabel } from '../../../../api/v1/instance-types';
import {
  formatResourceIdForReview,
  formatResourceIdsForReview,
} from '../../../../api/v1/networking';
import { useTranslation } from '../../../../hooks/useTranslation';

export {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';

const buildReviewSections = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
  t: TFunction,
  context: ReviewContext = {},
): ReviewSection[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const imageOverlay = getCatalogFieldOverlay(
    'spec.image.source_ref',
    definitions,
    t('catalogProvision.vm.fields.image'),
  );
  const userDataOverlay = getCatalogFieldOverlay(
    'spec.user_data',
    definitions,
    t('catalogProvision.vm.fields.userData'),
  );
  const bootDiskOverlay = getCatalogFieldOverlay(
    'spec.boot_disk.size_gib',
    definitions,
    t('catalogProvision.vm.fields.bootDisk'),
  );
  const sshKeyOverlay = getCatalogFieldOverlay(
    'ssh_key',
    definitions,
    t('catalogProvision.vm.fields.sshKey'),
  );

  const tagEntries = Object.entries(values.metadata.labels ?? {}).filter(
    ([k, v]) => k.trim() && v.trim(),
  );

  const additionalDisksRow =
    values.spec.additionalDisks.filter((d) => d.sizeGib?.trim()).length > 0
      ? reviewRow(
          'Additional disks',
          values.spec.additionalDisks
            .filter((d) => d.sizeGib?.trim())
            .map((d, i) => `Disk ${i + 1}: ${d.sizeGib} GiB`)
            .join(', '),
        )
      : null;

  return [
    {
      title: t('catalogProvision.steps.general.title'),
      rows: [
        reviewRow(t('catalogProvision.vm.fields.name'), formatReviewScalar(values.metadata.name)),
        reviewRow(sshKeyOverlay.label, formatReviewScalar(values.spec.sshKey, true)),
        ...(values.spec.projectId?.trim()
          ? [reviewRow('Project (predicted)', values.spec.projectId)]
          : []),
        ...(tagEntries.length > 0
          ? [reviewRow('Tags', tagEntries.map(([k, v]) => `${k}=${v}`).join(', '))]
          : []),
      ],
    },
    {
      title: t('catalogProvision.steps.configuration.title'),
      rows: [
        reviewRow(imageOverlay.label, formatReviewScalar(values.spec.image.sourceRef)),
        reviewRow(
          t('catalogProvision.vm.fields.instanceType'),
          formatInstanceTypeReviewLabel(
            values.spec.instanceType,
            context.instanceTypes ?? [],
            t('catalogProvision.instanceTypes.deprecatedSuffix'),
          ),
        ),
        reviewRow(bootDiskOverlay.label, formatBootDiskSizeForReview(values.spec.bootDisk.sizeGib)),
        ...(additionalDisksRow ? [additionalDisksRow] : []),
        reviewRow(userDataOverlay.label, formatReviewScalar(values.spec.userData, true)),
        reviewRow('Run strategy', formatReviewScalar(values.spec.runStrategy)),
        ...(values.spec.isWindows ? [reviewRow('Guest OS', 'Windows')] : []),
      ],
    },
    {
      title: t('catalogProvision.steps.networking.title'),
      rows: [
        reviewRow(
          t('catalogProvision.vm.fields.virtualNetwork'),
          formatResourceIdForReview(
            values.spec.networking.virtualNetworkId,
            context.virtualNetworks ?? [],
          ),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.subnet'),
          formatResourceIdForReview(values.spec.networking.subnetId, context.subnets ?? []),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.securityGroup'),
          formatResourceIdsForReview(
            values.spec.networking.securityGroupIds,
            context.securityGroups ?? [],
          ),
        ),
        reviewRow(
          t('Public IP'),
          values.spec.networking.publicIPPoolId
            ? formatResourceIdForReview(
                values.spec.networking.publicIPPoolId,
                context.publicIPPools ?? [],
              )
            : t('None'),
        ),
      ],
    },
  ];
};

export const useComputeInstanceAdapter = (): CatalogProvisionAdapter<
  ComputeInstanceCatalogItem,
  ComputeInstanceWizardValues,
  BuildComputeInstanceCreateBodyInput
> => {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      kind: 'compute_instance' as const,
      useCatalogItems: () => {
        const query = useComputeInstanceCatalogItems();
        return {
          data: query.data ?? [],
          isPending: query.isPending,
          isError: query.isError,
          refetch: () => {
            void query.refetch();
          },
        };
      },
      getInitialValues: (_catalogItem) => createEmptyComputeInstanceValues(),
      buildCreatePayload: buildComputeInstanceCreatePayload,
      ConfigurationStep: VmConfigurationStep,
      NetworkingStep: VmNetworkingStep,
      GeneralStepComponent: VmGeneralExtStep,
      resolveGeneralFields: (catalogItem) => buildVmGeneralFields(catalogItem, t),
      getStepValidationSchema: (catalogItem, stepId) =>
        buildComputeInstanceStepSchema(catalogItem, stepId, t),
      getReviewSections: (values, catalogItem, context) =>
        buildReviewSections(values, catalogItem, t, context),
      onCatalogItemSelected: (item, helpers) => {
        helpers.resetForm({
          values: {
            ...createEmptyComputeInstanceValues(),
            catalogItemId: item.id,
          },
        });
        applyVmCatalogConfigurationDefaults(item, helpers, t);
        applyVmCatalogGeneralDefaults(item, helpers, t);
      },
      wizardTitleKey: 'catalogProvision.vm.wizardTitle',
      wizardDescriptionKey: 'catalogProvision.vm.wizardDescription',
      breadcrumbCreateLabelKey: 'catalogProvision.vm.breadcrumbCreate',
      ariaLabelKey: 'catalogProvision.vm.ariaLabel',
    }),
    [t],
  );
};

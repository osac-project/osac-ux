import { useMemo } from 'react';
import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';

import { applyVmCatalogConfigurationDefaults } from './computeInstance/applyCatalogDefaults';
import { applyVmCatalogGeneralDefaults } from './computeInstance/applyCatalogGeneralDefaults';
import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';
import { buildComputeInstanceStepSchema } from './computeInstance/schemas';
import { VmAccessAndInitialRunStep } from './computeInstance/VmAccessAndInitialRunStep';
import { VmConfigurationStep } from './computeInstance/VmConfigurationStep';
import VmGeneralStep from './computeInstance/VmGeneralStep';
import { VmInstanceTypeStep } from './computeInstance/VmInstanceTypeStep';
import { VmNetworkingStep } from './computeInstance/VmNetworkingStep';
import { VmReviewStep } from './computeInstance/VmReviewStep';
import { VmStorageStep } from './computeInstance/VmStorageStep';
import type { CatalogProvisionAdapter } from './types';
import { useComputeInstanceCatalogItems } from '../../../../api/v1/compute-instance-catalog-item';
import { useSession } from '../../../../hooks/use-session';
import { useTranslation } from '../../../../hooks/useTranslation';

export {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';

export const useComputeInstanceAdapter = (): CatalogProvisionAdapter<
  ComputeInstanceCatalogItem,
  ComputeInstanceWizardValues,
  MessageInitShape<typeof ComputeInstanceSchema>
> => {
  const { t } = useTranslation();
  const { projects } = useSession();
  const defaultProject = projects.length === 1 ? projects[0] : '';

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
      getInitialValues: (_catalogItem) => createEmptyComputeInstanceValues(defaultProject),
      buildCreatePayload: buildComputeInstanceCreatePayload,
      ConfigurationStep: VmConfigurationStep,
      InstanceTypeStep: VmInstanceTypeStep,
      StorageStep: VmStorageStep,
      NetworkingStep: VmNetworkingStep,
      AccessAndInitialRunStep: VmAccessAndInitialRunStep,
      GeneralStep: VmGeneralStep,
      getStepValidationSchema: (catalogItem, stepId) =>
        buildComputeInstanceStepSchema(catalogItem, stepId, t),
      ReviewStep: VmReviewStep,
      onCatalogItemSelected: (item, helpers) => {
        helpers.resetForm({
          values: {
            ...createEmptyComputeInstanceValues(defaultProject),
            catalogItemId: item.id,
          },
        });
        applyVmCatalogConfigurationDefaults(item, helpers, t);
        applyVmCatalogGeneralDefaults(item, helpers);
      },
      wizardTitleKey: 'Create virtual machine',
      wizardDescriptionKey: 'catalogProvision.vm.wizardDescription',
      breadcrumbCreateLabelKey: 'catalogProvision.vm.breadcrumbCreate',
      ariaLabelKey: 'catalogProvision.vm.ariaLabel',
    }),
    [defaultProject, t],
  );
};

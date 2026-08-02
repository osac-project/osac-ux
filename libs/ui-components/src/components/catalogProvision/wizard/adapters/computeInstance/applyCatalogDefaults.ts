import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import {
  fieldDefinitionDefaultToInputString,
  isDynamicFieldPath,
  resolvedFieldDefault,
} from '../../../catalogFieldDefinition';
import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

const setDefault = (
  helpers: FormikHelpers<ComputeInstanceWizardValues>,
  path: string,
  value: unknown,
): void => {
  if (value !== undefined) {
    void helpers.setFieldValue(path, value);
  }
};

/** Apply catalog overlay defaults once when a catalog item is selected. */
export const applyVmCatalogConfigurationDefaults = (
  catalogItem: ComputeInstanceCatalogItem,
  helpers: FormikHelpers<ComputeInstanceWizardValues>,
  t: TFunction,
): void => {
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

  setDefault(helpers, 'spec.image.sourceRef', overlayDefaultToFormValue(imageOverlay));
  setDefault(helpers, 'spec.userData', overlayDefaultToFormValue(userDataOverlay));
  setDefault(helpers, 'spec.bootDisk.sizeGib', overlayDefaultToFormValue(bootDiskOverlay) ?? '');

  // Seed custom.* and template_parameters.* fields from the catalog item's org defaults —
  // makes the Tenant Admin's authoring-time defaults actually reach the provisioning user.
  const dynamicParameters: Record<string, string> = {};
  for (const def of definitions.filter((d) => isDynamicFieldPath(d.path))) {
    const resolved = resolvedFieldDefault(def);
    if (resolved !== undefined) {
      dynamicParameters[def.path] = fieldDefinitionDefaultToInputString(resolved);
    }
  }
  if (Object.keys(dynamicParameters).length > 0) {
    setDefault(helpers, 'spec.dynamicParameters', dynamicParameters);
  }
};

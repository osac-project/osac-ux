import type { FormikHelpers } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';

/** Apply a locked SSH Secret or editable catalog default to the general step. */
export const applyVmCatalogGeneralDefaults = (
  catalogItem: ComputeInstanceCatalogItem,
  helpers: FormikHelpers<ComputeInstanceWizardValues>,
): void => {
  const behavior = catalogItem.fields?.sshKey?.behavior;
  const reference =
    behavior?.case === 'locked'
      ? behavior.value
      : behavior?.case === 'editable'
        ? behavior.value.defaultValue
        : undefined;

  if (reference?.name) {
    void helpers.setFieldValue('spec.sshKey.name', reference.name);
  }

  const diskImageBehavior = catalogItem.fields?.diskImage?.behavior;
  const diskImageReference =
    diskImageBehavior?.case === 'locked'
      ? diskImageBehavior.value
      : diskImageBehavior?.case === 'editable'
        ? diskImageBehavior.value.defaultValue
        : undefined;

  if (diskImageReference) {
    void helpers.setFieldValue('spec.diskImage', {
      id: diskImageReference.id,
      name: diskImageReference.name,
    });
  }

  const instanceTypeBehavior = catalogItem.fields?.instanceType?.behavior;
  const instanceTypeReference =
    instanceTypeBehavior?.case === 'locked'
      ? instanceTypeBehavior.value
      : instanceTypeBehavior?.case === 'editable'
        ? instanceTypeBehavior.value.defaultValue
        : undefined;
  if (instanceTypeReference?.id || instanceTypeReference?.name) {
    void helpers.setFieldValue(
      'spec.instanceType',
      instanceTypeReference.id || instanceTypeReference.name,
    );
  }
};

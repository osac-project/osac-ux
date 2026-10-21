import { TFunction } from 'i18next';

import { CatalogProvisionKind } from '../catalogFieldDefinition';

// Full set of valid step ids (used for type + membership guard); not every kind uses all of them.
export const WIZARD_STEP_IDS = [
  'catalog',
  'general',
  'instance-type',
  'configuration',
  'storage',
  'networking',
  'access-and-initial-run',
  'review',
];

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export const STEP_LABEL_KEYS = (
  t: TFunction,
  kind?: CatalogProvisionKind,
): Record<WizardStepId, string> => ({
  catalog: kind === 'compute_instance' ? t('Select template') : t('Catalog item'),
  general: kind === 'compute_instance' ? t('Details') : t('General'),
  'instance-type': t('Instance type'),
  configuration: t('Configuration'),
  storage: t('Storage'),
  networking: t('Networking'),
  'access-and-initial-run': t('Access & Initial Run'),
  review: t('Review'),
});

// Default/cluster order — no Storage step (that step is compute-instance only).
const CLUSTER_WIZARD_STEPS: readonly WizardStepId[] = [
  'catalog',
  'general',
  'configuration',
  'networking',
  'review',
];

const BARE_METAL_WIZARD_STEPS: readonly WizardStepId[] = [
  'catalog',
  'general',
  'configuration',
  'networking',
  'review',
];

// Compute instances get dedicated Instance type and Storage steps before Networking.
// Other kinds (cluster, bare metal) keep their Configuration step.
const COMPUTE_INSTANCE_WIZARD_STEPS: readonly WizardStepId[] = [
  'catalog',
  'general',
  'instance-type',
  'storage',
  'networking',
  'access-and-initial-run',
  'review',
];

export const getWizardOrderedSteps = (kind?: CatalogProvisionKind): readonly WizardStepId[] => {
  if (kind === 'bare_metal_instance') {
    return BARE_METAL_WIZARD_STEPS;
  }
  if (kind === 'compute_instance') {
    return COMPUTE_INSTANCE_WIZARD_STEPS;
  }
  return CLUSTER_WIZARD_STEPS;
};

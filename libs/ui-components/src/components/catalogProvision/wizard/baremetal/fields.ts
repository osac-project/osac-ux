/** BareMetalInstanceRunStrategy numeric values (mirrors proto enum). */
export const BM_RUN_STRATEGY_ALWAYS = 1;
export const BM_RUN_STRATEGY_HALTED = 2;

export const BM_RUN_STRATEGY_OPTIONS = [
  { value: BM_RUN_STRATEGY_ALWAYS, label: 'Always (start immediately)' },
  { value: BM_RUN_STRATEGY_HALTED, label: 'Halted (start stopped)' },
] as const;

export interface BareMetalWizardValues {
  catalogItemId: string;
  name: string;
  /** BareMetalInstanceRunStrategy: 1=ALWAYS, 2=HALTED */
  runStrategy: number;
  sshPublicKey: string;
  userData: string;
}

export const createEmptyBareMetalValues = (initialCatalogItemId = ''): BareMetalWizardValues => ({
  catalogItemId: initialCatalogItemId,
  name: '',
  runStrategy: BM_RUN_STRATEGY_ALWAYS,
  sshPublicKey: '',
  userData: '',
});

/** Returns true when the step has sufficient data to advance. */
export const isBmStepValid = (stepIndex: number, values: BareMetalWizardValues): boolean => {
  switch (stepIndex) {
    case 0:
      return Boolean(values.catalogItemId);
    case 1:
      return values.name.trim().length > 0;
    default:
      return true;
  }
};

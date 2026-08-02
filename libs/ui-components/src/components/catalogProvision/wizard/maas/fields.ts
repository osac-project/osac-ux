export const DEFAULT_TOKEN_QUOTA = 1_000_000;
export const MIN_TOKEN_QUOTA = 100_000;
export const MAX_TOKEN_QUOTA = 50_000_000;

export interface MaaSWizardValues {
  catalogItemId: string;
  applicationName: string;
  tokenQuotaMonthly: number;
}

export const createEmptyMaaSValues = (initialCatalogItemId = ''): MaaSWizardValues => ({
  catalogItemId: initialCatalogItemId,
  applicationName: '',
  tokenQuotaMonthly: DEFAULT_TOKEN_QUOTA,
});

/** Returns true when the step has sufficient data to advance. */
export const isMaaSStepValid = (stepIndex: number, values: MaaSWizardValues): boolean => {
  switch (stepIndex) {
    case 0:
      return Boolean(values.catalogItemId);
    case 1:
      return values.applicationName.trim().length > 0;
    default:
      return true;
  }
};

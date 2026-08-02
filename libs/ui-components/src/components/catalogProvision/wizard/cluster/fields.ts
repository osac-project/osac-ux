import {
  type CatalogFieldDefinition,
  fieldDefinitionDefaultToInputString,
  resolvedFieldDefault,
  templateParameterPathFromName,
} from '../../catalogFieldDefinition';

export interface ClusterWizardValues {
  catalogItemId: string;
  name: string;
  pullSecret: string;
  sshPublicKey: string;
  releaseImage: string;
  podCidr: string;
  serviceCidr: string;
  /** Keyed by ClusterTemplateParameterDefinition.name, values are always strings (coerced on submit). */
  templateParameters: Record<string, string>;
  /** New custom.* fields a Tenant Admin authored — keyed by catalog field_definitions `path`.
   * Genuine template-declared parameters keep using `templateParameters` above. */
  customParameters: Record<string, string>;
}

export const createEmptyClusterValues = (initialCatalogItemId = ''): ClusterWizardValues => ({
  catalogItemId: initialCatalogItemId,
  name: '',
  pullSecret: '',
  sshPublicKey: '',
  releaseImage: '',
  podCidr: '',
  serviceCidr: '',
  templateParameters: {},
  customParameters: {},
});

export const DEFAULT_POD_CIDR = '10.128.0.0/14';
export const DEFAULT_SERVICE_CIDR = '172.30.0.0/16';

/**
 * Seeds one templateParameters slot per template-declared parameter, using the catalog
 * item's org-default field_definitions (`template_parameters.<name>`) when the Tenant
 * Admin set one, else an empty string. Existing (already-typed) values win.
 */
export const seedClusterTemplateParameterDefaults = (
  templateParameterNames: string[],
  definitions: CatalogFieldDefinition[],
  existing: Record<string, string>,
): Record<string, string> => ({
  ...Object.fromEntries(
    templateParameterNames.map((name) => {
      const def = definitions.find((d) => d.path === templateParameterPathFromName(name));
      const resolved = def ? resolvedFieldDefault(def) : undefined;
      return [name, resolved !== undefined ? fieldDefinitionDefaultToInputString(resolved) : ''];
    }),
  ),
  ...existing,
});

/** Returns true when the name field is non-empty and valid. */
export const isClusterNameValid = (name: string): boolean =>
  /^[a-z][a-z0-9-]{0,61}[a-z0-9]$/.test(name.trim()) || name.trim().length >= 1;

/** Returns true when the step is complete enough to advance. */
export const isStepValid = (stepIndex: number, values: ClusterWizardValues): boolean => {
  switch (stepIndex) {
    case 0:
      return Boolean(values.catalogItemId);
    case 1:
      return values.name.trim().length > 0 && values.pullSecret.trim().length > 0;
    default:
      return true;
  }
};

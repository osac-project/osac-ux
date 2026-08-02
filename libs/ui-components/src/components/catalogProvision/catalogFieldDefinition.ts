/**
 * Catalog item field_definitions — parse defaults, validate against JSON Schema subset, apply to spec paths.
 */

import { protobufValueToPlain } from './protobuf-value';

export type CatalogProvisionKind = 'compute_instance' | 'cluster';

export interface CatalogFieldDefinition {
  path: string;
  displayName: string;
  editable: boolean;
  default?: unknown;
  validationSchema?: Record<string, unknown>;
  /** Sourced from TemplateParameterDefinition.description — shown as helper text beneath the input. */
  description?: string;
  /** Sourced from TemplateParameterDefinition.required — drives FormGroup isRequired + validation. */
  required?: boolean;
  /**
   * When set, this field's value is chosen from a live API-backed list (see
   * customFieldApiSources.ts) rather than typed freeform — wire: source_api_path.
   */
  sourceApiPath?: string;
}

const asRecord = (v: unknown): Record<string, unknown> | undefined => {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
};

const unknownToString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

/** Parse google.protobuf.Value default (wire JSON or post-decode protobuf message). */
export const parseFieldDefinitionDefault = (raw: unknown): unknown => {
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  const r = asRecord(raw);
  if (!r) {
    return undefined;
  }
  const decodedKind = asRecord(r.kind);
  const hasDecodedDiscriminator =
    typeof decodedKind?.case === 'string' && decodedKind.case.length > 0;
  const hasWireDiscriminator =
    'null_value' in r ||
    'number_value' in r ||
    'string_value' in r ||
    'bool_value' in r ||
    'list_value' in r ||
    'struct_value' in r;
  if (!hasDecodedDiscriminator && !hasWireDiscriminator) {
    return raw;
  }
  const plain = protobufValueToPlain(raw);
  return plain === undefined ? undefined : plain;
};

const parseValidationSchema = (raw: unknown): Record<string, unknown> | undefined => {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asRecord(parsed);
    } catch {
      return undefined;
    }
  }
  return asRecord(raw);
};

export const normalizeCatalogFieldDefinition = (raw: unknown): CatalogFieldDefinition | null => {
  const r = asRecord(raw);
  if (!r) {
    return null;
  }
  const path = unknownToString(r.path ?? r.Path).trim();
  if (!path) {
    return null;
  }
  const displayName = unknownToString(
    r.display_name ?? r.displayName ?? r.DisplayName ?? path,
  ).trim();
  const editable = typeof r.editable === 'boolean' ? r.editable : true;
  const defaultRaw = r.default ?? r.Default;
  const defaultValue =
    defaultRaw !== undefined && defaultRaw !== null
      ? parseFieldDefinitionDefault(defaultRaw)
      : undefined;
  const validationSchema = parseValidationSchema(r.validation_schema ?? r.validationSchema);
  const description = unknownToString(r.description ?? r.Description).trim() || undefined;
  const requiredRaw = r.required ?? r.Required;
  const required = typeof requiredRaw === 'boolean' ? requiredRaw : undefined;
  const sourceApiPath =
    unknownToString(r.source_api_path ?? r.sourceApiPath ?? r.SourceApiPath).trim() || undefined;

  return {
    path,
    displayName: displayName || path,
    editable,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(validationSchema ? { validationSchema } : {}),
    ...(description ? { description } : {}),
    ...(required !== undefined ? { required } : {}),
    ...(sourceApiPath ? { sourceApiPath } : {}),
  };
};

export const normalizeCatalogFieldDefinitions = (raw: unknown): CatalogFieldDefinition[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(normalizeCatalogFieldDefinition)
    .filter((x): x is CatalogFieldDefinition => Boolean(x));
};

export const readCatalogItemFieldDefinitions = (item: unknown): readonly unknown[] | undefined => {
  if (!item || typeof item !== 'object') {
    return undefined;
  }
  const raw =
    (item as Record<string, unknown>).field_definitions ??
    (item as Record<string, unknown>).fieldDefinitions;
  return Array.isArray(raw) ? raw : undefined;
};

export const coerceCatalogFieldDefinitions = (
  definitions: readonly unknown[] | undefined,
): CatalogFieldDefinition[] => {
  if (!definitions?.length) {
    return [];
  }
  return definitions
    .map((raw) => normalizeCatalogFieldDefinition(raw))
    .filter((x): x is CatalogFieldDefinition => Boolean(x));
};

/** Normalized field_definitions from wire or test catalog item JSON. */
export const catalogItemFieldDefinitions = (item: unknown): CatalogFieldDefinition[] => {
  return coerceCatalogFieldDefinitions(readCatalogItemFieldDefinitions(item));
};

/**
 * Path namespace for brand-new fields a Tenant Admin defines during catalog-item
 * authoring — distinct from `template_parameters.*`, which stays reserved for the
 * selected Template's own declared parameters.
 */
export const CUSTOM_FIELD_PATH_PREFIX = 'custom.';

/** Wire-key prefix used when writing a custom field's value into a shared parameter bag, to
 * guarantee it can never collide with a real template parameter name. */
export const CUSTOM_FIELD_WIRE_KEY_PREFIX = 'custom__';

/** Path namespace for a Template's own declared `parameters[]` (see templateParametersToFieldDefs). */
export const TEMPLATE_PARAMETER_PATH_PREFIX = 'template_parameters.';

export const isCustomFieldPath = (path: string): boolean =>
  path.startsWith(CUSTOM_FIELD_PATH_PREFIX);

export const customFieldKeyFromPath = (path: string): string =>
  isCustomFieldPath(path) ? path.slice(CUSTOM_FIELD_PATH_PREFIX.length) : path;

export const customFieldPathFromKey = (key: string): string =>
  `${CUSTOM_FIELD_PATH_PREFIX}${key}`;

export const isTemplateParameterPath = (path: string): boolean =>
  path.startsWith(TEMPLATE_PARAMETER_PATH_PREFIX);

export const templateParameterNameFromPath = (path: string): string =>
  isTemplateParameterPath(path) ? path.slice(TEMPLATE_PARAMETER_PATH_PREFIX.length) : path;

export const templateParameterPathFromName = (name: string): string =>
  `${TEMPLATE_PARAMETER_PATH_PREFIX}${name}`;

/** True for any field a provisioning wizard should render dynamically: brand-new custom
 * fields plus the Template's own declared parameters. */
export const isDynamicFieldPath = (path: string): boolean =>
  isCustomFieldPath(path) || isTemplateParameterPath(path);

/**
 * Resolves the wire key used to write a dynamic field's value into a shared
 * `template_parameters` / `templateParameters` bag: `custom.<key>` paths get a
 * collision-safe `custom__` prefix, while `template_parameters.<name>` paths are
 * written under their bare declared name (the value the API/template expects).
 */
export const wireKeyForDynamicFieldPath = (path: string): string => {
  if (isCustomFieldPath(path)) {
    return `${CUSTOM_FIELD_WIRE_KEY_PREFIX}${customFieldKeyFromPath(path)}`;
  }
  if (isTemplateParameterPath(path)) {
    return templateParameterNameFromPath(path);
  }
  return path;
};

/** Spec paths shown on catalog cards as compute resources (CPU, memory, boot disk). */
export const CATALOG_ITEM_RESOURCE_FIELD_PATHS = [
  'cores',
  'memory_gib',
  'boot_disk.size_gib',
] as const;

export type CatalogItemResourceFieldPath = (typeof CATALOG_ITEM_RESOURCE_FIELD_PATHS)[number];

const catalogItemResourceFieldPathSet = new Set<string>(CATALOG_ITEM_RESOURCE_FIELD_PATHS);

export const isCatalogItemResourceFieldPath = (
  path: string,
): path is CatalogItemResourceFieldPath => {
  return catalogItemResourceFieldPathSet.has(path);
};

/** Node-set host type and worker count paths on cluster catalog cards (node set id varies). */
export const CLUSTER_CATALOG_ITEM_RESOURCE_FIELD_PATH_PATTERN =
  /^node_sets\.[^.]+\.(host_type|size)$/;

export const isClusterCatalogItemResourceFieldPath = (path: string): boolean => {
  return CLUSTER_CATALOG_ITEM_RESOURCE_FIELD_PATH_PATTERN.test(path);
};

export const isCatalogCardResourceFieldPath = (path: string): boolean => {
  return isCatalogItemResourceFieldPath(path) || isClusterCatalogItemResourceFieldPath(path);
};

export const fieldDefinitionDefaultToInputString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(', ');
  }
  return '';
};

export interface FieldValidationContext {
  displayName?: string;
}

const fieldLabel = (context?: FieldValidationContext): string => {
  const label = context?.displayName?.trim();
  return label || 'This field';
};

/** Compile JSON Schema `pattern` (ECMAScript regex) for client-side validation. */
export const compileJsonSchemaPattern = (pattern: unknown): RegExp | undefined => {
  if (typeof pattern !== 'string' || !pattern.trim()) {
    return undefined;
  }
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
};

export const jsonSchemaPatternErrorMessage = (label: string, pattern: string): string =>
  `${label} must match pattern: ${pattern}`;

export const matchesJsonSchemaPattern = (
  value: string,
  schema: Record<string, unknown>,
): boolean => {
  const regex = compileJsonSchemaPattern(schema.pattern);
  if (!regex) {
    return true;
  }
  return regex.test(value);
};

export const validateValueAgainstJsonSchema = (
  value: unknown,
  schema: Record<string, unknown> | undefined,
  context?: FieldValidationContext,
): string | null => {
  if (!schema || !Object.keys(schema).length) {
    return null;
  }

  const label = fieldLabel(context);
  const type = schema.type;
  if (type === 'integer' || type === 'number') {
    const n = typeof value === 'number' ? value : Number(String(value).trim());
    const min = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const max = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    const hasMin = min !== undefined;
    const hasMax = max !== undefined;

    if (!Number.isFinite(n)) {
      return `${label} must be a valid number.`;
    }
    if (type === 'integer' && !Number.isInteger(n)) {
      return `${label} must be a whole number.`;
    }
    if (hasMin && hasMax) {
      if (n < min) {
        return `${label} must be between ${min} and ${max}. The value you entered is too low.`;
      }
      if (n > max) {
        return `${label} must be between ${min} and ${max}. The value you entered is too high.`;
      }
      return null;
    }
    if (hasMin && n < min) {
      return `${label} must be ${min} or greater.`;
    }
    if (hasMax && n > max) {
      return `${label} must be ${max} or less.`;
    }
    return null;
  }

  if (type === 'string') {
    const s = typeof value === 'string' ? value : unknownToString(value);
    const minLen = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLen = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    const hasMin = minLen !== undefined;
    const hasMax = maxLen !== undefined;

    if (hasMin && hasMax) {
      if (s.length < minLen) {
        return `${label} must be between ${minLen} and ${maxLen} characters. The value you entered is too short.`;
      }
      if (s.length > maxLen) {
        return `${label} must be between ${minLen} and ${maxLen} characters. The value you entered is too long.`;
      }
      return null;
    }
    if (hasMin && s.length < minLen) {
      return `${label} must be at least ${minLen} characters long.`;
    }
    if (hasMax && s.length > maxLen) {
      return `${label} must be no more than ${maxLen} characters long.`;
    }
    if (!matchesJsonSchemaPattern(s, schema)) {
      const pattern = typeof schema.pattern === 'string' ? schema.pattern : '';
      return jsonSchemaPatternErrorMessage(label, pattern);
    }
    return null;
  }

  if (type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return `${label} must be true or false.`;
    }
    return null;
  }

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const s = typeof value === 'string' ? value : unknownToString(value);
    if (!enumValues.some((entry) => String(entry) === s)) {
      return `${label} must be one of: ${enumValues.map(String).join(', ')}.`;
    }
    return null;
  }

  return null;
};

export const resolvedFieldDefault = (def: CatalogFieldDefinition): unknown => {
  if (def.default === undefined) {
    return undefined;
  }
  const parsed = parseFieldDefinitionDefault(def.default);
  return parsed !== undefined ? parsed : def.default;
};

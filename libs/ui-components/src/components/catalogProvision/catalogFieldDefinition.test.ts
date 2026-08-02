import { describe, expect, it } from 'vitest';

import {
  CUSTOM_FIELD_WIRE_KEY_PREFIX,
  customFieldKeyFromPath,
  customFieldPathFromKey,
  isCustomFieldPath,
  isDynamicFieldPath,
  isTemplateParameterPath,
  normalizeCatalogFieldDefinition,
  resolvedFieldDefault,
  templateParameterNameFromPath,
  templateParameterPathFromName,
  wireKeyForDynamicFieldPath,
} from './catalogFieldDefinition';

describe('normalizeCatalogFieldDefinition — sourceApiPath', () => {
  it('parses source_api_path from wire JSON', () => {
    const def = normalizeCatalogFieldDefinition({
      path: 'custom.rack_zone',
      display_name: 'Rack zone',
      editable: true,
      source_api_path: 'v1/host_types',
    });

    expect(def?.sourceApiPath).toBe('v1/host_types');
  });

  it('parses camelCase sourceApiPath', () => {
    const def = normalizeCatalogFieldDefinition({
      path: 'custom.rack_zone',
      editable: true,
      sourceApiPath: 'v1/instance_types',
    });

    expect(def?.sourceApiPath).toBe('v1/instance_types');
  });

  it('omits sourceApiPath when absent', () => {
    const def = normalizeCatalogFieldDefinition({
      path: 'custom.rack_zone',
      editable: true,
    });

    expect(def?.sourceApiPath).toBeUndefined();
  });
});

describe('custom.* path helpers', () => {
  it('identifies custom.* paths', () => {
    expect(isCustomFieldPath('custom.rack_zone')).toBe(true);
    expect(isCustomFieldPath('template_parameters.cluster_name')).toBe(false);
    expect(isCustomFieldPath('spec.boot_disk.size_gib')).toBe(false);
  });

  it('round-trips key <-> path', () => {
    expect(customFieldKeyFromPath('custom.rack_zone')).toBe('rack_zone');
    expect(customFieldPathFromKey('rack_zone')).toBe('custom.rack_zone');
  });
});

describe('template_parameters.* path helpers', () => {
  it('identifies template_parameters.* paths', () => {
    expect(isTemplateParameterPath('template_parameters.cluster_name')).toBe(true);
    expect(isTemplateParameterPath('custom.rack_zone')).toBe(false);
  });

  it('round-trips name <-> path', () => {
    expect(templateParameterNameFromPath('template_parameters.cluster_name')).toBe(
      'cluster_name',
    );
    expect(templateParameterPathFromName('cluster_name')).toBe(
      'template_parameters.cluster_name',
    );
  });
});

describe('isDynamicFieldPath', () => {
  it('is true for both custom.* and template_parameters.* paths', () => {
    expect(isDynamicFieldPath('custom.rack_zone')).toBe(true);
    expect(isDynamicFieldPath('template_parameters.cluster_name')).toBe(true);
    expect(isDynamicFieldPath('spec.boot_disk.size_gib')).toBe(false);
  });
});

describe('wireKeyForDynamicFieldPath', () => {
  it('prefixes custom.* keys with custom__ to avoid collisions', () => {
    expect(wireKeyForDynamicFieldPath('custom.rack_zone')).toBe(
      `${CUSTOM_FIELD_WIRE_KEY_PREFIX}rack_zone`,
    );
  });

  it('resolves template_parameters.* paths to their bare declared name', () => {
    expect(wireKeyForDynamicFieldPath('template_parameters.cluster_name')).toBe('cluster_name');
  });

  it('never collides between a custom field and a template parameter of the same key', () => {
    const customKey = wireKeyForDynamicFieldPath(customFieldPathFromKey('cluster_name'));
    const templateKey = wireKeyForDynamicFieldPath(templateParameterPathFromName('cluster_name'));
    expect(customKey).not.toBe(templateKey);
  });

  it('passes through unrecognized paths unchanged', () => {
    expect(wireKeyForDynamicFieldPath('spec.boot_disk.size_gib')).toBe('spec.boot_disk.size_gib');
  });
});

describe('resolvedFieldDefault', () => {
  it('returns undefined when no default is set', () => {
    expect(
      resolvedFieldDefault({ path: 'custom.rack_zone', displayName: 'Rack zone', editable: true }),
    ).toBeUndefined();
  });

  it('resolves a plain scalar default', () => {
    expect(
      resolvedFieldDefault({
        path: 'custom.rack_zone',
        displayName: 'Rack zone',
        editable: true,
        default: 'us-east-1a',
      }),
    ).toBe('us-east-1a');
  });

  it('resolves a protobuf-Value-shaped default', () => {
    expect(
      resolvedFieldDefault({
        path: 'custom.node_count',
        displayName: 'Node count',
        editable: true,
        default: { number_value: 3 },
      }),
    ).toBe(3);
  });
});

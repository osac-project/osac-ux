import { describe, expect, it } from 'vitest';

import { seedClusterTemplateParameterDefaults } from './fields';
import type { CatalogFieldDefinition } from '../../catalogFieldDefinition';

describe('seedClusterTemplateParameterDefaults', () => {
  it('seeds a slot per template parameter from the matching template_parameters.<name> default', () => {
    const definitions: CatalogFieldDefinition[] = [
      {
        path: 'template_parameters.workerCount',
        displayName: 'Worker count',
        editable: true,
        default: 3,
      },
      {
        path: 'template_parameters.enableAutoscaling',
        displayName: 'Enable autoscaling',
        editable: true,
        default: true,
      },
    ];

    const result = seedClusterTemplateParameterDefaults(
      ['workerCount', 'enableAutoscaling', 'undeclaredParam'],
      definitions,
      {},
    );

    expect(result).toEqual({
      workerCount: '3',
      enableAutoscaling: 'true',
      undeclaredParam: '',
    });
  });

  it('leaves parameters with no matching definition as an empty string', () => {
    const result = seedClusterTemplateParameterDefaults(['someParam'], [], {});
    expect(result).toEqual({ someParam: '' });
  });

  it('preserves already-typed values over the org default', () => {
    const definitions: CatalogFieldDefinition[] = [
      {
        path: 'template_parameters.workerCount',
        displayName: 'Worker count',
        editable: true,
        default: 3,
      },
    ];

    const result = seedClusterTemplateParameterDefaults(['workerCount'], definitions, {
      workerCount: '7',
    });

    expect(result).toEqual({ workerCount: '7' });
  });

  it('ignores custom.* field definitions since they are not template-declared parameters', () => {
    const definitions: CatalogFieldDefinition[] = [
      {
        path: 'custom.rackZone',
        displayName: 'Rack zone',
        editable: true,
        default: 'zone-a',
      },
    ];

    const result = seedClusterTemplateParameterDefaults(['workerCount'], definitions, {});

    expect(result).toEqual({ workerCount: '' });
  });
});

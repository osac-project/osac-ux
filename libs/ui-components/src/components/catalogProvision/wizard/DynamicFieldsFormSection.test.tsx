import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CatalogFieldDefinition } from '../catalogFieldDefinition';
import { renderWizardElement } from '../test/renderWizard';
import type { ApiFetch } from '../../../api/types';
import { DynamicFieldsFormSection } from './DynamicFieldsFormSection';

const CUSTOM_TEXT_DEF: CatalogFieldDefinition = {
  path: 'custom.rack_zone',
  displayName: 'Rack zone',
  editable: true,
};

const CUSTOM_NUMBER_DEF: CatalogFieldDefinition = {
  path: 'custom.node_count',
  displayName: 'Node count',
  editable: true,
  validationSchema: { type: 'number' },
};

const CUSTOM_BOOLEAN_DEF: CatalogFieldDefinition = {
  path: 'custom.enable_gpu',
  displayName: 'Enable GPU',
  editable: true,
  validationSchema: { type: 'boolean' },
};

const CUSTOM_API_DEF: CatalogFieldDefinition = {
  path: 'custom.host_type',
  displayName: 'Host type',
  editable: true,
  sourceApiPath: 'v1/host_types',
};

const TEMPLATE_PARAMETER_DEF: CatalogFieldDefinition = {
  path: 'template_parameters.cluster_name',
  displayName: 'Cluster name',
  editable: true,
};

const NON_DYNAMIC_DEF: CatalogFieldDefinition = {
  path: 'spec.boot_disk.size_gib',
  displayName: 'Boot disk',
  editable: true,
};

const hostTypesFetch: ApiFetch = async (route) => {
  if (route === 'v1/host_types') {
    return {
      items: [
        { id: 'ht-1', metadata: { name: 'gpu-a100' } },
        { id: 'ht-2', metadata: { name: 'gpu-h100' } },
      ],
    } as never;
  }
  throw new Error(`Unexpected API route in DynamicFieldsFormSection test: ${route}`);
};

describe('DynamicFieldsFormSection', () => {
  it('renders nothing when there are no dynamic (custom.* / template_parameters.*) definitions', async () => {
    const { container } = await renderWizardElement(
      <DynamicFieldsFormSection
        definitions={[NON_DYNAMIC_DEF]}
        values={{}}
        onChange={vi.fn()}
      />,
      { fetch: hostTypesFetch },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders both custom.* and template_parameters.* fields by default', async () => {
    await renderWizardElement(
      <DynamicFieldsFormSection
        definitions={[CUSTOM_TEXT_DEF, TEMPLATE_PARAMETER_DEF, NON_DYNAMIC_DEF]}
        values={{}}
        onChange={vi.fn()}
      />,
      { fetch: hostTypesFetch },
    );

    expect(screen.getByLabelText('Rack zone')).toBeInTheDocument();
    expect(screen.getByLabelText('Cluster name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Boot disk')).not.toBeInTheDocument();
  });

  it('respects a filter restricting to custom.* fields only', async () => {
    await renderWizardElement(
      <DynamicFieldsFormSection
        definitions={[CUSTOM_TEXT_DEF, TEMPLATE_PARAMETER_DEF]}
        values={{}}
        onChange={vi.fn()}
        filter={(def) => def.path.startsWith('custom.')}
      />,
      { fetch: hostTypesFetch },
    );

    expect(screen.getByLabelText('Rack zone')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cluster name')).not.toBeInTheDocument();
  });

  it('renders a numeric input for number-typed fields', async () => {
    await renderWizardElement(
      <DynamicFieldsFormSection
        definitions={[CUSTOM_NUMBER_DEF]}
        values={{}}
        onChange={vi.fn()}
      />,
      { fetch: hostTypesFetch },
    );

    expect(screen.getByLabelText('Node count')).toHaveAttribute('type', 'number');
  });

  it('renders a checkbox for boolean-typed fields and reports changes', async () => {
    const onChange = vi.fn();
    const { user } = await renderWizardElement(
      <DynamicFieldsFormSection
        definitions={[CUSTOM_BOOLEAN_DEF]}
        values={{}}
        onChange={onChange}
      />,
      { fetch: hostTypesFetch },
    );

    const checkbox = screen.getByLabelText('Enable GPU');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith('custom.enable_gpu', 'true');
  });

  it('renders an API-sourced select populated from the curated source and reports changes', async () => {
    const onChange = vi.fn();
    const { user } = await renderWizardElement(
      <DynamicFieldsFormSection definitions={[CUSTOM_API_DEF]} values={{}} onChange={onChange} />,
      { fetch: hostTypesFetch },
    );

    const select = await waitFor(() => screen.getByLabelText('Host type') as HTMLSelectElement);
    await waitFor(() => {
      expect(select.querySelectorAll('option')).toHaveLength(3); // placeholder + 2 options
    });

    await user.selectOptions(select, 'ht-2');
    expect(onChange).toHaveBeenCalledWith('custom.host_type', 'ht-2');
  });
});

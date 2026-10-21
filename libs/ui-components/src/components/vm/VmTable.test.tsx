import type { ComponentProps } from 'react';
import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import {
  ComputeInstanceCatalogItemReferenceSchema,
  ComputeInstanceState,
  ComputeInstanceTemplateReferenceSchema,
  InstanceTypeReferenceSchema,
} from '@osac/types';

import { VmTable } from './VmTable';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('./VmActionsMenu', () => ({
  VmActionsMenu: () => <button type="button">Actions</button>,
}));

const runningVm: ComputeInstance = {
  $typeName: 'osac.public.v1.ComputeInstance',
  id: 'vm-1',
  metadata: {
    name: 'web-01',
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
    creationTimestamp: {
      $typeName: 'google.protobuf.Timestamp',
      seconds: 1767225600n,
      nanos: 0,
    },
  },
  spec: {
    $typeName: 'osac.public.v1.ComputeInstanceSpec',
    additionalDisks: [],
    catalogItem: create(ComputeInstanceCatalogItemReferenceSchema, { id: '' }),
    networkAttachments: [],
    template: create(ComputeInstanceTemplateReferenceSchema, { id: '' }),
    templateParameters: {},
    instanceType: create(InstanceTypeReferenceSchema, { id: 'standard-4-8' }),
    autoExternalIpAttachment: false,
  },
  status: {
    $typeName: 'osac.public.v1.ComputeInstanceStatus',
    conditions: [],
    state: ComputeInstanceState.RUNNING,
    internalIpAddress: '10.0.0.5',
    externalIpAddress: '203.0.113.1',
  },
};

const renderTable = (props: Partial<ComponentProps<typeof VmTable>> = {}) =>
  renderWithProviders(<VmTable vms={[runningVm]} {...props} />);

describe('VmTable', () => {
  it('renders updated column headers', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Internal IP' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'External IP' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Instance type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Created' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'vCPU' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Memory' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'IP' })).not.toBeInTheDocument();
  });

  it('shows split IP addresses', () => {
    renderTable();

    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
  });

  it('links the VM name to its details page', () => {
    renderTable();

    expect(screen.getByRole('link', { name: 'web-01' })).toHaveAttribute('href', '/vms/vm-1');
  });

  it('links the project to its project page', () => {
    renderTable();

    expect(screen.getByRole('link', { name: 'foo' })).toHaveAttribute('href', '/projects/foo');
  });

  it('masks IPs and disables the name link while deleting', () => {
    const deletingVm = {
      ...runningVm,
      status: {
        ...runningVm.status,
        state: ComputeInstanceState.DELETING,
      },
    } as ComputeInstance;

    renderWithProviders(<VmTable vms={[deletingVm]} />);

    expect(screen.queryByRole('link', { name: 'web-01' })).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});

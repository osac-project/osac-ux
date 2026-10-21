import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import VmDetails from './VmDetails';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('../../../api/v1/instance-types', () => ({
  useInstanceType: vi.fn(),
}));

vi.mock('./VmDetailsActionButtons', () => ({
  default: () => <div>Action buttons</div>,
}));

vi.mock('./VmNetworkingTab', () => ({
  default: () => <div>Networking tab</div>,
}));

vi.mock('../console/VmConsoleTab', () => ({
  default: () => <div>Console tab</div>,
}));

vi.mock('../../Resource/ResourceDetailHeader', () => ({
  ResourceDetailHeader: ({ resourceName }: { resourceName: string }) => <h1>{resourceName}</h1>,
}));

vi.mock('../../../VmStatusLabel', () => ({
  VmStatusLabel: () => <span>Running</span>,
}));

const { useInstanceType } = await import('../../../api/v1/instance-types');

const vm = {
  id: 'vm-1',
  metadata: { name: 'web-01', project: 'project alpha' },
  spec: {
    instanceType: { id: 'standard-4-8' },
    catalogItem: { id: 'catalog-vm-1', name: 'General purpose VM' },
    sshKey: { id: 'secret-ssh-1', name: 'alice-laptop-key' },
  },
  status: { state: ComputeInstanceState.RUNNING },
} as ComputeInstance;

const renderDetails = () => renderWithProviders(<VmDetails vm={vm} />);

describe('VmDetails', () => {
  beforeEach(() => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInstanceType>);
  });

  it('renders the reference-style overview, networking, and console sections', () => {
    renderDetails();

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Access & initial run' })).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('No alerts')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('Networking tab')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'General purpose VM' })).toHaveAttribute(
      'href',
      '/vms/create/catalog-vm-1',
    );
    expect(screen.getByRole('link', { name: 'project alpha' })).toHaveAttribute(
      'href',
      '/projects/project%20alpha',
    );
    expect(screen.getByRole('link', { name: 'alice-laptop-key' })).toHaveAttribute(
      'href',
      '/secrets/secret-ssh-1',
    );
  });

  it('shows an alert and still renders the page when instance type lookup fails', () => {
    vi.mocked(useInstanceType).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Instance type unavailable'),
    } as ReturnType<typeof useInstanceType>);

    renderDetails();

    expect(screen.getByText('Could not load instance types')).toBeInTheDocument();
    expect(screen.getByText('Instance type unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'web-01' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });
});

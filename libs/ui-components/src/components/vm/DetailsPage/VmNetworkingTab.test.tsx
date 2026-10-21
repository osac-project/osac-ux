import { useLocation } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';

import VmNetworkingTab from './VmNetworkingTab';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('./useVmNetworkAttachmentRows', () => ({
  useVmNetworkAttachmentRows: vi.fn(),
}));

const { useVmNetworkAttachmentRows } = await import('./useVmNetworkAttachmentRows');

const LocationProbe = () => {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
};

const renderTab = (vm: ComputeInstance) =>
  renderWithProviders(
    <>
      <VmNetworkingTab vm={vm} />
      <LocationProbe />
    </>,
  );

describe('VmNetworkingTab', () => {
  it('renders resolved networking names', () => {
    vi.mocked(useVmNetworkAttachmentRows).mockReturnValue([
      {
        virtualNetwork: { id: 'vn-1', name: 'prod-vn' },
        subnet: { id: 'subnet-1', name: 'prod-subnet' },
        virtualNetworkId: 'vn-1',
        securityGroups: [
          { id: 'sg-1', name: 'web-sg' },
          { id: 'sg-2', name: 'default-sg' },
        ],
      },
    ]);

    const vm = {
      id: 'vm-1',
      status: { internalIpAddress: '10.0.0.5' },
      spec: {
        networkAttachments: [
          {
            subnet: { id: 'subnet-1' },
            securityGroups: [{ id: 'sg-1' }, { id: 'sg-2' }],
          },
        ],
      },
    } as ComputeInstance;

    renderTab(vm);

    expect(screen.getByRole('button', { name: 'Add network' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Internal IP' })).toBeInTheDocument();
    expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'prod-vn' })).toHaveAttribute(
      'href',
      '/networking/virtual-networks/vn-1',
    );
    expect(screen.getByRole('link', { name: 'prod-subnet' })).toHaveAttribute(
      'href',
      '/networking/virtual-networks/vn-1',
    );
    expect(screen.getByRole('link', { name: 'web-sg' })).toHaveAttribute(
      'href',
      '/networking/security-groups/sg-1',
    );
    expect(screen.getByRole('link', { name: 'default-sg' })).toHaveAttribute(
      'href',
      '/networking/security-groups/sg-2',
    );
  });

  it('opens the virtual network create modal from the add network action', async () => {
    vi.mocked(useVmNetworkAttachmentRows).mockReturnValue([]);

    const { user } = renderTab({ id: 'vm-1', spec: {} } as ComputeInstance);

    await user.click(screen.getByRole('button', { name: 'Add network' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/networking/virtual-networks?create=virtual-network',
    );
  });

  it('shows empty state when there are no attachments', () => {
    vi.mocked(useVmNetworkAttachmentRows).mockReturnValue([]);

    renderTab({ id: 'vm-1', spec: {} } as ComputeInstance);
    expect(screen.getByText('No virtual networks configured.')).toBeInTheDocument();
  });
});

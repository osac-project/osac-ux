import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalIP, NATGateway, Subnet, VirtualNetwork } from '@osac/types';
import { ExternalIPState, SubnetState, VirtualNetworkState } from '@osac/types';

import { VIRTUAL_NETWORKS_VIEW_KEY, VirtualNetworksListPage } from './VirtualNetworksListPage';
import { SessionProvider } from '../../hooks/use-session';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../api/v1/project', () => ({
  useAllProjects: () => ({ data: [], isLoading: false, error: null }),
  useProjects: () => ({ data: [], isLoading: false, error: null }),
}));

const virtualNetworks = [
  {
    id: 'vn-1',
    metadata: {
      name: 'vn-prod',
      project: 'project-a',
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
    },
    spec: { ipv4Cidr: '10.0.0.0/16' },
    status: { state: VirtualNetworkState.READY },
  },
  {
    id: 'vn-2',
    metadata: { name: 'vn-dev' },
    spec: { ipv4Cidr: '10.1.0.0/16' },
    status: { state: VirtualNetworkState.PENDING },
  },
] as VirtualNetwork[];

const subnets = [
  {
    id: 'subnet-1',
    metadata: { name: 'subnet-a' },
    spec: { virtualNetwork: { id: 'vn-1' }, ipv4Cidr: '10.0.1.0/24' },
    status: { state: SubnetState.READY },
  },
] as Subnet[];

const natGateways = [
  {
    id: 'nat-1',
    metadata: { name: 'nat-egress' },
    spec: { virtualNetwork: { id: 'vn-1' }, externalIp: { id: 'eip-1' } },
  },
] as NATGateway[];

const externalIps = [
  {
    id: 'eip-1',
    metadata: { name: 'eip-1' },
    status: {
      state: ExternalIPState.EXTERNAL_IP_STATE_ALLOCATED,
      attached: false,
      address: '203.0.113.10',
    },
  },
] as ExternalIP[];

const renderPage = (overrides?: {
  virtualNetworks?: VirtualNetwork[];
  natGateways?: NATGateway[];
  onNatGatewayList?: (req: unknown) => void;
  routerEntries?: string[];
}) =>
  renderWithProviders(
    <SessionProvider role="tenant-user" username="test-user" tenantId="test-tenant">
      <VirtualNetworksListPage />
    </SessionProvider>,
    {
      apiFixtures: {
        virtualNetworks: overrides?.virtualNetworks ?? virtualNetworks,
        subnets,
        natGateways: overrides?.natGateways ?? natGateways,
        externalIps,
      },
      transportOverrides: {
        onNatGatewayList: overrides?.onNatGatewayList,
      },
      routerEntries: overrides?.routerEntries,
    },
  );

describe('VirtualNetworksListPage', () => {
  beforeEach(() => {
    localStorage.setItem(`${VIRTUAL_NETWORKS_VIEW_KEY}-view-type`, 'list');
  });

  it('renders the section label, title, and create button', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Virtual networks' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create virtual network' })).toBeInTheDocument();
    await screen.findByRole('link', { name: 'vn-prod' });
  });

  it('opens the create modal when requested by the route', async () => {
    renderPage({ routerEntries: ['/networking/virtual-networks?create=virtual-network'] });

    expect(
      await screen.findByRole('dialog', { name: 'Create virtual network' }),
    ).toBeInTheDocument();
  });

  it('renders virtual network names as details links', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'vn-prod' })).toHaveAttribute(
      'href',
      '/networking/virtual-networks/vn-1',
    );
  });

  it('shows empty state when no virtual networks exist', async () => {
    renderPage({ virtualNetworks: [] });

    expect(await screen.findByText(/No virtual networks yet/i)).toBeInTheDocument();
  });

  it('shows the NAT gateway name and address, or a dash when none is attached', async () => {
    renderPage();

    expect(await screen.findByText('NAT gateway')).toBeInTheDocument();
    const table = screen.getByRole('grid');
    const rows = within(table).getAllByRole('row');
    const prodRow = rows.find((row) => within(row).queryByRole('link', { name: 'vn-prod' }));
    const devRow = rows.find((row) => within(row).queryByRole('link', { name: 'vn-dev' }));
    expect(prodRow).toBeDefined();
    expect(devRow).toBeDefined();

    const prodNatCell = within(prodRow as HTMLElement).getAllByRole('cell')[6];
    expect(within(prodNatCell).getByText('nat-egress')).toBeInTheDocument();
    expect(within(prodNatCell).getByText('203.0.113.10')).toBeInTheDocument();
    expect(within(prodNatCell).queryByText('Ready')).not.toBeInTheDocument();
    const devNatCell = within(devRow as HTMLElement).getAllByRole('cell')[6];
    expect(within(devNatCell).getByText('—')).toBeInTheDocument();
  });

  it('fetches NAT gateways once for the table', async () => {
    let listCalls = 0;
    renderPage({
      onNatGatewayList: () => {
        listCalls += 1;
      },
    });

    await screen.findByRole('link', { name: 'vn-prod' });
    await waitFor(() => {
      expect(listCalls).toBe(1);
    });
  });

  it('supports switching to the card view', async () => {
    const { user } = renderPage();

    await screen.findByRole('link', { name: 'vn-prod' });
    await user.click(screen.getByRole('button', { name: 'Card view' }));

    expect(screen.getByRole('link', { name: 'vn-prod' })).toBeInTheDocument();
    expect(screen.getAllByText('Security groups')).toHaveLength(2);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('shows project and created fields in card footers', async () => {
    const { user } = renderPage();

    await screen.findByRole('link', { name: 'vn-prod' });
    await user.click(screen.getByRole('button', { name: 'Card view' }));

    expect(screen.getByRole('link', { name: 'project-a' })).toHaveAttribute(
      'href',
      '/projects/project-a',
    );
    expect(screen.getAllByText('Created')).toHaveLength(2);
    expect(screen.getByRole('time')).toHaveAttribute('datetime', '2024-05-29T16:26:40.000Z');
  });

  it('filters virtual networks by status', async () => {
    const { user } = renderPage();

    await screen.findByRole('link', { name: 'vn-prod' });
    await user.selectOptions(screen.getByLabelText('Filter virtual networks by status'), 'ready');

    expect(screen.getByRole('link', { name: 'vn-prod' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'vn-dev' })).not.toBeInTheDocument();
  });
});

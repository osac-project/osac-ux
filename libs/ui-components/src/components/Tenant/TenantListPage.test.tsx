import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Tenant } from '@osac/types/private';
import { TenantState } from '@osac/types/private';

import TenantListPage from './TenantListPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeTenant = (
  id: string,
  name: string,
  state?: TenantState,
  billingAccount: string | null = `${id}-enterprise-billing`,
) =>
  ({
    id,
    metadata: {
      name,
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
      annotations: billingAccount
        ? {
            'osac.io/billing-account': billingAccount,
            'osac.io/billing-account-id': id,
          }
        : {},
    },
    spec: { domains: [`${name}.example.com`] },
    status: state !== undefined ? { state } : undefined,
  }) as unknown as Tenant;

const defaultTenants = [
  makeTenant('t-1', 'acme', TenantState.SYNCED),
  makeTenant('t-2', 'globex', TenantState.PENDING),
];

const renderPage = (tenants: Tenant[] = defaultTenants) =>
  renderWithProviders(<TenantListPage />, { apiFixtures: { tenants } });

describe('TenantListPage', () => {
  it('renders the page title', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tenants' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Create tenant' })).toHaveAttribute(
      'href',
      '/admin/tenants/create',
    );
  });

  it('renders tenant rows with names', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme')).toBeInTheDocument();
    });
    expect(screen.getByText('globex')).toBeInTheDocument();
  });

  it('renders status labels for each tenant', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders primary domain for each tenant', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme.example.com')).toBeInTheDocument();
    });
    expect(screen.getByText('globex.example.com')).toBeInTheDocument();
  });

  it('shows when billing is not linked in card footers', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Billing not linked')).toHaveLength(2);
    });
    expect(screen.queryByText('Placement')).not.toBeInTheDocument();
  });

  it('shows the billing account or inactive state in card details', async () => {
    renderPage([makeTenant('t-unlinked', 'unlinked', TenantState.PENDING, null)]);

    await waitFor(() => {
      expect(screen.getByText('Billing')).toBeInTheDocument();
    });
    expect(screen.getByText('Billing account inactive')).toBeInTheDocument();
  });

  it('renders billing accounts for each tenant', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'List view' }));

    await waitFor(() => {
      expect(screen.getByText('t-1-enterprise-billing')).toBeInTheDocument();
    });
    expect(screen.getByText('t-2-enterprise-billing')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Billing account' })).toBeInTheDocument();
  });

  it('shows tenant actions in the list view', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'List view' }));
    await user.click(screen.getByRole('button', { name: 'Actions for acme' }));

    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'View IdP information' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toBeInTheDocument();
  });

  it('shows empty state when there are no tenants', async () => {
    renderPage([]);

    await waitFor(() => {
      expect(screen.getByText('No tenants yet. Register one to get started.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows filtered empty state when search matches nothing', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search tenants' });
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No tenants match your search.')).toBeInTheDocument();
    expect(screen.queryByText('acme')).not.toBeInTheDocument();
  });

  it('filters tenants by name', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('acme')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search tenants' });
    await user.type(searchInput, 'acme');

    expect(screen.getByText('acme')).toBeInTheDocument();
    expect(screen.queryByText('globex')).not.toBeInTheDocument();
  });
});

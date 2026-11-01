import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { IdentityProvider } from '@osac/types';
import { IdentityProviderPhase } from '@osac/types';

import IdentityProviderListPage from './IdentityProviderListPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeIdentityProvider = (id: string, title: string, phase?: IdentityProviderPhase) =>
  ({
    id,
    metadata: {
      name: 'north-summit-bank',
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
    },
    spec: {
      title,
      enabled: true,
      config: { case: 'oidc' as const, value: { issuer: 'https://sso.example.com' } },
    },
    status: phase !== undefined ? { phase, message: '', conditions: [] } : undefined,
  }) as IdentityProvider;

const defaultIdentityProviders = [
  makeIdentityProvider('idp-1', 'Corporate OIDC', IdentityProviderPhase.READY),
  makeIdentityProvider('idp-2', 'GitHub SSO', IdentityProviderPhase.ERROR),
];

const renderPage = (identityProviders: IdentityProvider[] = defaultIdentityProviders) =>
  renderWithProviders(<IdentityProviderListPage />, {
    apiFixtures: { identityProviders },
  });

describe('IdentityProviderListPage', () => {
  it('renders the page title', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Identity providers' })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Create identity provider' })).toHaveAttribute(
      'href',
      '/tenant/identity-provider/create',
    );
  });

  it('renders identity provider rows with titles', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Corporate OIDC')).toBeInTheDocument();
    });
    expect(screen.getByText('GitHub SSO')).toBeInTheDocument();
  });

  it('renders status labels for each identity provider', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders protocol and issuer URL columns from the API', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('OpenID Connect (OIDC)')).toHaveLength(2);
      expect(screen.getAllByText('https://sso.example.com')).toHaveLength(2);
      expect(screen.getAllByText('north-summit-bank')).toHaveLength(2);
    });
    expect(screen.getByRole('columnheader', { name: 'Protocol' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Issuer URL' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Created' })).not.toBeInTheDocument();
  });

  it('shows empty state when there are no identity providers', async () => {
    renderPage([]);

    await waitFor(() => {
      expect(
        screen.getByText('No identity providers yet. Create one to get started.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows filtered empty state when search matches nothing', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('Corporate OIDC')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', {
      name: 'Search identity providers',
    });
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No identity providers match your search.')).toBeInTheDocument();
    expect(screen.queryByText('Corporate OIDC')).not.toBeInTheDocument();
  });

  it('filters identity providers by title', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('Corporate OIDC')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', {
      name: 'Search identity providers',
    });
    await user.type(searchInput, 'Corporate');

    expect(screen.getByText('Corporate OIDC')).toBeInTheDocument();
    expect(screen.queryByText('GitHub SSO')).not.toBeInTheDocument();
  });
});

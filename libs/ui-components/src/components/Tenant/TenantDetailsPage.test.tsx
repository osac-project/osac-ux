import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type Role, type RoleBinding, RoleBindingState, RoleState, type User } from '@osac/types';
import { ConditionStatus, TenantConditionType, TenantState } from '@osac/types/private';
import type { Tenant } from '@osac/types/private';

import TenantDetailsPage from './TenantDetailsPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeTenant = (): Tenant =>
  ({
    id: 'tenant-acme',
    metadata: {
      name: 'Acme Corp',
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
      creator: 'cloud-provider-admin',
      description: 'Primary tenant for Acme Corporation workloads.',
      annotations: {
        'osac.io/company-logo': '/red-hat-logo.svg',
        'osac.io/company-logo-filename': 'acme-corporation-logo.svg',
      },
    },
    spec: {
      domains: ['acme.example.com', 'acme-corp.example.com'],
      breakGlassCredentialsSecret: {
        id: 'secret-acme-break-glass',
        name: 'acme-break-glass-credentials',
      },
    },
    status: {
      state: TenantState.SYNCED,
      message: 'Tenant synced to the identity provider.',
      idpTenantName: 'acme-corp',
      breakGlassUserId: 'acme-break-glass-admin',
      conditions: [
        {
          type: TenantConditionType.DEFAULT_NETWORKING_READY,
          status: ConditionStatus.TRUE,
          message: 'Default networking resources are ready.',
        },
        {
          type: TenantConditionType.VAULT_READY,
          status: ConditionStatus.TRUE,
          message: 'The tenant vault namespace is ready.',
        },
        {
          type: TenantConditionType.COMPUTE_INFRASTRUCTURE_READY,
          status: ConditionStatus.TRUE,
          message: 'Compute infrastructure is ready.',
        },
      ],
    },
  }) as unknown as Tenant;

const acmeRoles: Role[] = [
  {
    id: 'role-admin',
    metadata: { name: 'tenant-admin' },
    spec: { title: 'Tenant Administrator', description: '' },
    status: { state: RoleState.READY },
  } as unknown as Role,
];

const acmeRoleBindings: RoleBinding[] = [
  {
    id: 'rb-acme-admin',
    spec: {
      role: { id: 'role-admin', name: 'tenant-admin', shared: true },
      users: [{ id: 'user-1', name: 'alice' }],
    },
    status: { state: RoleBindingState.READY },
  } as unknown as RoleBinding,
];

const acmeUsers: User[] = [
  {
    id: 'user-1',
    metadata: { name: 'Alice Johnson' },
    spec: { username: 'alice', email: 'alice@acme.com', enabled: true },
  } as unknown as User,
];

const renderPage = (tenant?: Tenant) =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/tenants/:id" element={<TenantDetailsPage />} />
    </Routes>,
    {
      apiFixtures: {
        tenants: tenant ? [tenant] : [],
        roles: acmeRoles,
        roleBindings: acmeRoleBindings,
        users: acmeUsers,
      },
      routerEntries: [`/admin/tenants/${tenant?.id ?? 'missing'}`],
    },
  );

describe('TenantDetailsPage', () => {
  it('renders tenant overview and setup progress from the API model', async () => {
    renderPage(makeTenant());

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tenant setup' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resource usage' })).toBeInTheDocument();
    expect(screen.getByText('Instances by service')).toBeInTheDocument();
    expect(screen.getByText('Instances by project')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Tenant Administrator')).toBeInTheDocument();
    });
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Assign roles' })).toHaveAttribute(
      'href',
      '/tenant/role-binding/create',
    );
    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    expect(screen.getByText('acme.example.com')).toBeInTheDocument();
    expect(screen.getByText('Company logo')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'acme-corporation-logo.svg' })).toHaveAttribute(
      'src',
      '/red-hat-logo.svg',
    );
    expect(screen.getByText('acme-corp.example.com')).toBeInTheDocument();
    expect(screen.getByText('acme-break-glass-credentials')).toBeInTheDocument();
    expect(screen.getByText('Default networking')).toBeInTheDocument();
    expect(screen.getByText('Compute infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Primary tenant for Acme Corporation workloads.')).toBeInTheDocument();
  });

  it('renders the not-found state for an unknown tenant', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Tenant not found')).toBeInTheDocument();
    });
  });
});

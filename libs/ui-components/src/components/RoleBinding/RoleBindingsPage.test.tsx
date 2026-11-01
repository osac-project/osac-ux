import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Role, RoleBinding, User } from '@osac/types';
import { RoleBindingState, ServiceTier } from '@osac/types';

import RoleBindingsPage from './RoleBindingsPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../hooks/use-session', () => ({
  useSession: vi.fn(() => ({
    role: 'tenant-admin',
    username: 'testuser',
    tenantId: 'tenant-1',
    enabledServices: [ServiceTier.CAAS, ServiceTier.VMAAS, ServiceTier.BMAAS],
  })),
}));

const { useSession } = await import('../../hooks/use-session');

const makeRole = (id: string, title: string, description = ''): Role =>
  ({
    id,
    metadata: {
      name: id,
    },
    spec: { title, description },
    status: { state: 0, message: '' },
  }) as Role;

const makeRoleBinding = (
  id: string,
  roleId: string,
  userIds: string[],
  state = RoleBindingState.READY,
): RoleBinding =>
  ({
    id,
    metadata: {
      name: id,
    },
    spec: {
      role: {
        id: roleId,
        name: roleId,
      },
      users: userIds.map((uid) => ({ id: uid, name: uid })),
    },
    status: { state, message: '' },
  }) as RoleBinding;

const makeUser = (id: string, username: string, email: string): User =>
  ({
    id,
    metadata: { name: id },
    spec: { username, email },
    status: {},
  }) as User;

const defaultRoles = [
  makeRole('role-viewer', 'Viewer', 'Read-only access'),
  makeRole('role-editor', 'Editor', 'Edit resources'),
];

const defaultRoleBindings = [
  makeRoleBinding('rb-1', 'role-viewer', ['user-1', 'user-2']),
  makeRoleBinding('rb-2', 'role-editor', ['user-3'], RoleBindingState.PENDING),
];

const defaultUsers = [
  makeUser('user-1', 'alice', 'alice@example.com'),
  makeUser('user-2', 'bob', 'bob@example.com'),
  makeUser('user-3', 'charlie', 'charlie@example.com'),
];

const renderPage = ({
  roles = defaultRoles,
  roleBindings = defaultRoleBindings,
  users = defaultUsers,
}: {
  roles?: Role[];
  roleBindings?: RoleBinding[];
  users?: User[];
} = {}) =>
  renderWithProviders(<RoleBindingsPage />, {
    apiFixtures: { roles, roleBindings, users },
  });

describe('RoleBindingsPage', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      role: 'tenant-admin',
      username: 'testuser',
      tenantId: 'tenant-1',
      enabledServices: [ServiceTier.CAAS, ServiceTier.VMAAS, ServiceTier.BMAAS],
      userTheme: 'system',
      resolvedTheme: 'light',
      setUserTheme: vi.fn(),
      userContrast: 'system',
      resolvedContrast: 'glass',
      setUserContrast: vi.fn(),
      projects: [],
      setProjects: vi.fn(),
    });
  });

  it('renders the page title', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
    });
  });

  it('renders one row per user with name, email and role badge', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('charlie@example.com')).toBeInTheDocument();

    // Each user shows its role as a badge
    const viewerLabels = screen.getAllByText('Viewer');
    expect(viewerLabels).toHaveLength(2); // alice and bob share the Viewer binding

    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('shows empty state when there are no role bindings', async () => {
    renderPage({ roleBindings: [] });

    await waitFor(() => {
      expect(screen.getByText('No role bindings available.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the create role binding link', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Create role binding' })).toBeInTheDocument();
    });
  });

  it('renders an actions menu for each user row', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByRole('button', { name: /Actions for/ });
    expect(actionButtons).toHaveLength(3);
  });

  it('opens a confirmation modal when remove is clicked', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Actions for user-1' }));
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Remove user-1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders the search input and role filter', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    expect(screen.getByRole('searchbox', { name: 'Search users' })).toBeInTheDocument();
    expect(screen.getByText(/Role:/)).toBeInTheDocument();
  });

  it('filters users by free-text search on name', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    const search = screen.getByRole('searchbox', { name: 'Search users' });
    await userEvent.type(search, 'alice');

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('charlie@example.com')).not.toBeInTheDocument();
  });

  it('filters users by free-text search on email', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    const search = screen.getByRole('searchbox', { name: 'Search users' });
    await userEvent.type(search, 'bob@example');

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument();
  });

  it('shows no-results message when search matches nothing', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    const search = screen.getByRole('searchbox', { name: 'Search users' });
    await userEvent.type(search, 'zzz-no-match');

    expect(screen.getByText('No users match your filters.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

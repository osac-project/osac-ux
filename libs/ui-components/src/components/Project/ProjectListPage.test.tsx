import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '@osac/types';
import { ProjectState, ServiceTier } from '@osac/types';

import ProjectListPage from './ProjectListPage';
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

const makeProject = (id: string, name: string, state = ProjectState.ACTIVE): Project =>
  ({
    id,
    metadata: {
      name,
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
    },
    spec: { title: name },
    status: { state },
  }) as Project;

const defaultProjects = [
  makeProject('p-1', 'frontend', ProjectState.ACTIVE),
  makeProject('p-2', 'backend', ProjectState.PENDING),
];

const renderPage = (projects: Project[] = defaultProjects) =>
  renderWithProviders(<ProjectListPage />, {
    apiFixtures: { projects },
  });

describe('ProjectListPage', () => {
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

  it('renders the page title and description', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'Carve your tenant workspace into isolated projects and grant team members scoped access.',
      ),
    ).toBeInTheDocument();
  });

  it('renders project rows without a status column', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('shows service counts instead of service names', async () => {
    const baseProject = makeProject('p-services', 'services');
    const project = {
      ...baseProject,
      metadata: {
        ...baseProject.metadata,
        annotations: { 'osac.io/services': 'VMaaS, BMaaS, CaaS' },
      },
    } as Project;
    renderPage([project]);

    await waitFor(() => {
      expect(screen.getByText('3 services')).toBeInTheDocument();
    });
    expect(screen.queryByText('VMaaS, BMaaS, CaaS')).not.toBeInTheDocument();
  });

  it('shows the Create project link for tenant-admin', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Create project' })).toHaveAttribute(
        'href',
        '/projects/create',
      );
    });
  });

  it('hides the Create project link for tenant-user', async () => {
    vi.mocked(useSession).mockReturnValue({
      role: 'tenant-user',
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

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Create project' })).not.toBeInTheDocument();
  });

  it('shows empty state when there are no projects', async () => {
    renderPage([]);

    await waitFor(() => {
      expect(screen.getByText('No projects yet. Create one to get started.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows filtered empty state when search matches nothing', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search projects' });
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No projects match your search.')).toBeInTheDocument();
    expect(screen.queryByText('frontend')).not.toBeInTheDocument();
  });

  it('filters projects by name', async () => {
    const { user } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox', { name: 'Search projects' });
    await user.type(searchInput, 'front');

    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.queryByText('backend')).not.toBeInTheDocument();
  });

  it('shows "default" for projects with empty name', async () => {
    const emptyNameProject = makeProject('p-3', '');
    renderPage([emptyNameProject]);

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('builds the tree from dotted project names', async () => {
    const rootProject = makeProject('p-root', 'root');
    const nestedProject = {
      ...makeProject('p-child', 'root.child'),
      metadata: {
        ...makeProject('p-child', 'root.child').metadata,
        project: 'unrelated-parent',
      },
    } as Project;

    const { user } = renderPage([rootProject, nestedProject]);

    await waitFor(() => {
      expect(screen.getByText('root')).toBeInTheDocument();
      expect(screen.getByText('root.child')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Collapse root' }));

    expect(screen.queryByText('root.child')).not.toBeInTheDocument();
  });
});

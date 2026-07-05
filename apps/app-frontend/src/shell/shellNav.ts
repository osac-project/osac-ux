/** Role-based sidebar navigation (sectioned NavGroup layout). Nav icons: shellNavIcon in @osac/ui-components/icons */
import type { TFunction } from 'i18next';

import type { DemoShellRole } from '@osac/ui-components/shellTypes';

export type NavLink = { id: string; label: string; path: string };

export type NavSection = {
  kind: 'section';
  sectionId: string;
  label: string;
  children: NavLink[];
};

export type NavRow = NavSection;

const getTenantUserNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-tenant-projects',
    label: t('Projects'),
    children: [
      { id: 'projects-new', label: t('New project'), path: '/projects/new' },
      { id: 'projects-list', label: t('Projects'), path: '/projects' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-tenant-services',
    label: t('Instances'),
    children: [
      { id: 'catalog', label: t('Catalog'), path: '/catalog' },
      { id: 'compute-vms', label: t('Virtual Machines'), path: '/vms' },
      { id: 'clusters', label: t('Clusters'), path: '/clusters' },
      { id: 'bare-metal', label: t('Bare Metal'), path: '/bare-metal' },
      { id: 'ai-models', label: t('AI Models'), path: '/models' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-tenant-network',
    label: t('Networking'),
    children: [
      { id: 'networks', label: t('Networks'), path: '/networks' },
      { id: 'tenant-public-ips', label: t('Public IPs'), path: '/ips' },
      { id: 'load-balancers', label: t('Load Balancers'), path: '/load-balancers' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-tenant-storage',
    label: t('Storage'),
    children: [
      { id: 'block-volumes', label: t('Volumes'), path: '/storage/volumes' },
      { id: 'tenant-snapshots', label: t('Snapshots'), path: '/storage/snapshots' },
      { id: 'object-storage', label: t('Storage Buckets'), path: '/bucket-storage' },
      { id: 'storage-tiers', label: t('Storage Tiers'), path: '/storage/tiers' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-dev',
    label: t('Development'),
    children: [{ id: 'dev-api-diff', label: t('API Diff'), path: '/dev/api-diff' }],
  },
];

const getTenantAdminNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-admin-overview',
    label: t('Overview'),
    children: [{ id: 'admin-dashboard', label: t('Dashboard'), path: '/admin/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-projects',
    label: t('Projects'),
    children: [
      { id: 'projects-new', label: t('New project'), path: '/projects/new' },
      { id: 'projects-list', label: t('Projects'), path: '/projects' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-mgmt',
    label: t('Management'),
    children: [
      { id: 'admin-users', label: t('Users'), path: '/admin/users' },
      { id: 'admin-role-bindings', label: t('Role Bindings'), path: '/admin/role-bindings' },
      {
        id: 'admin-identity-providers',
        label: t('Identity Providers'),
        path: '/admin/identity-providers',
      },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-network',
    label: t('Networking'),
    children: [
      { id: 'admin-networks', label: t('Networks'), path: '/networks' },
      { id: 'tenant-public-ips-admin', label: t('Public IPs'), path: '/ips' },
      { id: 'load-balancers', label: t('Load Balancers'), path: '/load-balancers' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-admin-storage',
    label: t('Storage'),
    children: [
      { id: 'block-volumes', label: t('Volumes'), path: '/storage/volumes' },
      { id: 'tenant-snapshots', label: t('Snapshots'), path: '/storage/snapshots' },
      { id: 'object-storage', label: t('Storage Buckets'), path: '/bucket-storage' },
      { id: 'storage-tiers', label: t('Storage Tiers'), path: '/storage/tiers' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-dev',
    label: t('Development'),
    children: [{ id: 'dev-api-diff', label: t('API Diff'), path: '/dev/api-diff' }],
  },
];

const getProviderAdminNav = (t: TFunction): NavRow[] => [
  {
    kind: 'section',
    sectionId: 'nav-provider-overview',
    label: t('Overview'),
    children: [{ id: 'provider-dashboard', label: t('Dashboard'), path: '/provider/dashboard' }],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-mgmt',
    label: t('Management'),
    children: [
      { id: 'provider-orgs', label: t('Tenant organizations'), path: '/provider/organizations' },
      { id: 'provider-catalog', label: t('Global catalog'), path: '/provider/catalog' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-catalog-studio',
    label: t('Catalog Studio'),
    children: [
      { id: 'provider-catalog-studio', label: t('Studio'), path: '/provider/catalog-studio' },
      { id: 'provider-templates', label: t('Templates'), path: '/provider/templates' },
      { id: 'provider-host-types', label: t('Host Types'), path: '/provider/host-types' },
      {
        id: 'provider-instance-types',
        label: t('Instance Types'),
        path: '/provider/instance-types',
      },
      { id: 'provider-ai-setup', label: t('AI Setup'), path: '/provider/ai-setup' },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-network',
    label: t('Networking'),
    children: [
      {
        id: 'provider-network-classes',
        label: t('Network classes'),
        path: '/provider/network-classes',
      },
      {
        id: 'provider-ip-pools',
        label: t('IP Pools'),
        path: '/provider/ip-pools',
      },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-provider-storage',
    label: t('Storage'),
    children: [
      {
        id: 'provider-storage-backends',
        label: t('Storage Backends'),
        path: '/provider/storage-backends',
      },
      {
        id: 'provider-storage-tiers',
        label: t('Storage Tiers'),
        path: '/provider/storage-tiers',
      },
    ],
  },
  {
    kind: 'section',
    sectionId: 'nav-dev',
    label: t('Development'),
    children: [{ id: 'dev-api-diff', label: t('API Diff'), path: '/dev/api-diff' }],
  },
];

export const navRowsForRole = (role: DemoShellRole, t: TFunction): NavRow[] => {
  if (role === 'providerAdmin') {
    return getProviderAdminNav(t);
  }
  if (role === 'tenantAdmin') {
    return getTenantAdminNav(t);
  }
  return getTenantUserNav(t);
};

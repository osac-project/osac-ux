import { describe, expect, it } from 'vitest';

import { ServiceTier } from '@osac/types';
import type { UserRole } from '@osac/ui-components/shellTypes';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import { NavLink, NavSection, isNavLink, isNavSection, navRowsForRole } from './shellNav';

const nonIdpRoles: UserRole[] = ['tenant-admin', 'tenant-user'];
const allServices: ServiceTier[] = [
  ServiceTier.CAAS,
  ServiceTier.BMAAS,
  ServiceTier.VMAAS,
  ServiceTier.MAAS,
];

const findLink = (role: UserRole, linkId: string): NavLink | undefined =>
  navRowsForRole(role, tIdentity, allServices).find(
    (row) => isNavLink(row) && row.id === linkId,
  ) as NavLink | undefined;

const findSection = (role: UserRole, sectionId: string): NavSection | undefined =>
  navRowsForRole(role, tIdentity, allServices).find(
    (row) => isNavSection(row) && row.id === sectionId,
  ) as NavSection | undefined;

const servicesChildren = (role: UserRole) =>
  findSection(role, 'nav-tenant-services')?.children ?? [];

describe('navRowsForRole', () => {
  it('orders tenant navigation as Catalog, Services, Projects, Networking, Storage, Secrets', () => {
    expect(navRowsForRole('tenant-user', tIdentity, allServices).map((row) => row.id)).toEqual([
      'catalog',
      'nav-tenant-services',
      'projects',
      'nav-tenant-networking',
      'secrets',
    ]);
  });

  it('orders tenant-admin navigation as Catalog, Services, Projects, Networking, Storage, Identity, Secrets', () => {
    expect(navRowsForRole('tenant-admin', tIdentity, allServices).map((row) => row.id)).toEqual([
      'catalog',
      'nav-tenant-services',
      'projects',
      'nav-tenant-networking',
      'nav-tenant-storage',
      'nav-tenant-identity',
      'secrets',
    ]);
  });

  it('includes Virtual Machines, Clusters, and Bare Metal under Services for tenant roles', () => {
    for (const role of nonIdpRoles) {
      expect(servicesChildren(role)).toEqual([
        {
          kind: 'link',
          id: 'bare-metal',
          label: 'Bare Metal',
          path: '/bare-metal',
          service: ServiceTier.BMAAS,
        },
        {
          kind: 'link',
          id: 'clusters',
          label: 'Clusters',
          path: '/clusters',
          service: ServiceTier.CAAS,
        },
        {
          kind: 'link',
          id: 'compute-vms',
          label: 'Virtual Machines',
          path: '/vms',
          service: ServiceTier.VMAAS,
        },
      ]);
    }
    expect(servicesChildren('tenant-idp-manager')).toEqual([]);
  });

  it('removes unavailable service links and empty service sections', () => {
    const rows = navRowsForRole('tenant-user', tIdentity, [ServiceTier.CAAS]);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'catalog' }),
        expect.objectContaining({
          id: 'nav-tenant-services',
          children: [expect.objectContaining({ id: 'clusters', service: ServiceTier.CAAS })],
        }),
      ]),
    );
    expect(
      navRowsForRole('tenant-user', tIdentity, []).some(
        (row) => isNavSection(row) && row.id === 'nav-tenant-services',
      ),
    ).toBe(false);
  });

  it.each([
    { service: ServiceTier.CAAS, linkId: 'clusters' },
    { service: ServiceTier.VMAAS, linkId: 'compute-vms' },
    { service: ServiceTier.BMAAS, linkId: 'bare-metal' },
  ])('keeps only the enabled $service service link', ({ service, linkId }) => {
    const services = navRowsForRole('tenant-user', tIdentity, [service]).find(
      (row) => isNavSection(row) && row.id === 'nav-tenant-services',
    );

    expect(services).toEqual(
      expect.objectContaining({
        children: [expect.objectContaining({ id: linkId, service })],
      }),
    );
  });

  it('hides MaaS navigation from the cloud-provider-admin surface', () => {
    const rows = navRowsForRole('tenant-user', tIdentity, [ServiceTier.MAAS]);

    expect(rows.some((row) => isNavSection(row) && row.id === 'nav-tenant-services')).toBe(false);
    expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'catalog' })]));
    expect(findSection('tenant-user', 'nav-ai-grid')).toBeUndefined();
    expect(findSection('admin', 'nav-ai-grid')).toBeUndefined();
  });

  it('removes tenant navigation sections from the cloud-provider-admin surface', () => {
    expect(
      navRowsForRole('admin', tIdentity, allServices)
        .slice(0, 4)
        .map((row) => row.id),
    ).toEqual(['catalog', 'nav-administration', 'secrets']);
  });

  it('includes Catalog for admin and tenant roles but not IDP manager', () => {
    for (const role of [...nonIdpRoles, 'admin'] as UserRole[]) {
      expect(findLink(role, 'catalog')).toBeDefined();
    }
    expect(findLink('tenant-user', 'projects')).toBeDefined();
    expect(findLink('tenant-admin', 'projects')).toBeDefined();
    expect(findLink('admin', 'projects')).toBeUndefined();
    expect(findLink('tenant-idp-manager', 'catalog')).toBeUndefined();
    expect(findLink('tenant-idp-manager', 'projects')).toBeUndefined();
  });

  it('includes Networking section for all roles except IDP manager', () => {
    for (const role of ['tenant-admin'] as UserRole[]) {
      const networking = findSection(role, 'nav-tenant-networking');
      expect(networking).toBeDefined();
      expect(networking?.children).toEqual([
        {
          kind: 'link',
          id: 'virtual-networks',
          label: 'Virtual networks',
          path: '/networking/virtual-networks',
        },
        {
          kind: 'link',
          id: 'security-groups',
          label: 'Security groups',
          path: '/networking/security-groups',
        },
        {
          kind: 'link',
          id: 'external-ips',
          label: 'External IPs',
          path: '/networking/external-ips',
        },
      ]);
    }
    expect(findSection('tenant-user', 'nav-tenant-networking')?.children).toEqual([
      {
        kind: 'link',
        id: 'virtual-networks',
        label: 'Virtual networks',
        path: '/networking/virtual-networks',
      },
      {
        kind: 'link',
        id: 'external-ips',
        label: 'External IPs',
        path: '/networking/external-ips',
      },
    ]);
    const networking = findSection('tenant-idp-manager', 'nav-tenant-networking');
    expect(networking).toBeUndefined();
  });

  it('Administration section shows up only for admin role', () => {
    expect(findSection('admin', 'nav-administration')).toBeDefined();
    for (const role of ['tenant-user', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      expect(findSection(role, 'nav-administration')).toBeUndefined();
    }
  });

  it('includes Tenants and Billing under Administration for admin role', () => {
    expect(findSection('admin', 'nav-administration')?.children).toEqual([
      { kind: 'link', id: 'tenant', label: 'Tenants', path: '/admin/tenants' },
      { kind: 'link', id: 'billing', label: 'Billing', path: '/admin/billing' },
      {
        kind: 'link',
        id: 'external-ip-pools',
        label: 'External IP pools',
        path: '/admin/infrastructure/external-ip-pools',
      },
    ]);
  });

  it('does not show AI Grid for the cloud-provider-admin role', () => {
    expect(findSection('admin', 'nav-ai-grid')).toBeUndefined();
    expect(findSection('admin', 'nav-administration')?.children).toEqual([
      { kind: 'link', id: 'tenant', label: 'Tenants', path: '/admin/tenants' },
      { kind: 'link', id: 'billing', label: 'Billing', path: '/admin/billing' },
      {
        kind: 'link',
        id: 'external-ip-pools',
        label: 'External IP pools',
        path: '/admin/infrastructure/external-ip-pools',
      },
    ]);
  });

  it('hides Infrastructure and keeps only External IP pools under Administration for admin role', () => {
    expect(findSection('admin', 'nav-infrastructure')).toBeUndefined();
    expect(findSection('admin', 'nav-administration')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'external-ip-pools' })]),
    );
    for (const role of ['tenant-user', 'tenant-admin', 'tenant-idp-manager'] as UserRole[]) {
      expect(findSection(role, 'nav-infrastructure')).toBeUndefined();
    }
  });

  it('includes Storage section with Volumes link for tenant admins', () => {
    const storage = findSection('tenant-admin', 'nav-tenant-storage');
    expect(storage).toBeDefined();
    expect(storage?.children).toEqual([
      { kind: 'link', id: 'volumes', label: 'Volumes', path: '/storage/volumes' },
    ]);
    expect(findSection('tenant-user', 'nav-tenant-storage')).toBeUndefined();
  });

  it('excludes tenant Storage section for admin role', () => {
    expect(findSection('admin', 'nav-tenant-storage')).toBeUndefined();
  });

  it('excludes tenant Storage section for IDP manager', () => {
    expect(findSection('tenant-idp-manager', 'nav-tenant-storage')).toBeUndefined();
  });

  it('IDP sections show for tenant-idp-manager and Identity shows for tenant-admin', () => {
    expect(findLink('tenant-idp-manager', 'idp')).toBeDefined();
    expect(findLink('tenant-idp-manager', 'role-bindings')).toBeDefined();
    expect(findSection('tenant-admin', 'nav-tenant-identity')).toEqual({
      kind: 'section',
      id: 'nav-tenant-identity',
      label: 'Administration',
      children: [
        {
          kind: 'link',
          id: 'idp',
          label: 'Identity providers',
          path: '/tenant/identity-provider',
        },
        {
          kind: 'link',
          id: 'role-bindings',
          label: 'Roles',
          path: '/tenant/role-binding',
        },
        {
          kind: 'link',
          id: 'billing',
          label: 'Billing',
          path: '/tenant/billing',
        },
      ],
    });

    const catalogLink = findLink('tenant-idp-manager', 'catalog');
    expect(catalogLink).toBeUndefined();
  });
});

/**
 * API Coverage — networking domain
 * Routes: virtual_networks, subnets, security_groups, network_classes
 *
 * NetworkListPage is tab-based. The default tab is "vnets"; other resources
 * are loaded only when their tab is active (?tab=subnets, etc.).
 * For pages that fire requests immediately on mount the intercept must be
 * registered BEFORE visiting — use trackApi({ visitUrl }).
 *
 * network_classes is critical: the "Create network" button is disabled when
 * this endpoint returns no items.
 */

describe('[networking]', () => {
  beforeEach(() => cy.realLogin());

  // ── virtual_networks (default tab) ────────────────────────────────────────
  it('GET v1/virtual_networks — returns items', () => {
    cy.trackApi('networking', 'v1/virtual_networks', { visitUrl: '/networks' });
    cy.checkField('networking', 'NetworkListPage', 'Network list rows', '.pf-v5-c-table tbody tr, [data-testid="network-row"]');
  });

  // ── subnets (subnets tab) ─────────────────────────────────────────────────
  it('GET v1/subnets — returns items', () => {
    cy.trackApi('networking', 'v1/subnets', { visitUrl: '/networks?tab=subnets' });
  });

  // ── security_groups (security-groups tab) ─────────────────────────────────
  it('GET v1/security_groups — returns items', () => {
    cy.trackApi('networking', 'v1/security_groups', { visitUrl: '/networks?tab=security-groups' });
  });

  // ── network_classes (classes tab + create form) ───────────────────────────
  it('GET v1/network_classes — returns items (classes tab)', () => {
    cy.trackApi('networking', 'v1/network_classes', { visitUrl: '/networks?tab=classes' });
    cy.checkField(
      'networking',
      'NetworkListPage',
      'Network classes list',
      '.pf-v5-c-table tbody tr, [data-testid="network-class-row"]',
    );
  });

  it('GET v1/network_classes — returns items (create form prerequisite)', () => {
    cy.trackApi('networking', 'v1/network_classes', { visitUrl: '/networks/new' });
    cy.checkField(
      'networking',
      'VirtualNetworkNewPage',
      'Network class select options',
      'select option:not([disabled]), [data-testid="network-class-option"], .pf-v5-c-select__menu-item',
    );
  });
});

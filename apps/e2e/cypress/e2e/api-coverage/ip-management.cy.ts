/**
 * API Coverage — ip-management domain
 * Routes: public_ips, public_ip_pools, public_ip_attachments,
 *         external_ips, external_ip_pools
 */

describe('[ip-management]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/public_ips — returns items', () => {
    cy.trackApi('ip-management', 'v1/public_ips', { visitUrl: '/ips' });
    cy.checkField('ip-management', 'TenantPublicIPsPage', 'Public IP rows', '.pf-v5-c-table tbody tr, [data-testid="ip-row"]');
  });

  it('GET v1/public_ip_attachments — returns items', () => {
    cy.trackApi('ip-management', 'v1/public_ip_attachments', { visitUrl: '/ips' });
  });

  it('GET v1/external_ips — returns items', () => {
    cy.trackApi('ip-management', 'v1/external_ips', { visitUrl: '/ips' });
  });

  it('GET v1/public_ip_pools — returns items (provider)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('ip-management', 'v1/public_ip_pools', { visitUrl: '/provider/ip-pools' });
    cy.checkField('ip-management', 'ProviderIPPoolsPage', 'IP pool rows', '.pf-v5-c-table tbody tr, [data-testid="pool-row"]');
  });

  it('GET v1/external_ip_pools — returns items (provider)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('ip-management', 'v1/external_ip_pools', { visitUrl: '/provider/ip-pools' });
  });
});

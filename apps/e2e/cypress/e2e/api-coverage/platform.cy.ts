/**
 * API Coverage — platform domain
 * Routes: capabilities, tenants, organizations
 */

describe('[platform]', () => {
  it('GET v1/capabilities — returns data', () => {
    cy.realLogin();
    cy.trackApi('platform', 'v1/capabilities', { visitUrl: '/vms' });
  });

  it('GET v1/tenants — returns items (provider)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('platform', 'v1/tenants', { visitUrl: '/provider/organizations' });
    cy.checkField('platform', 'ProviderTenantOrgsPage', 'Tenant org rows', '.pf-v5-c-table tbody tr, [data-testid="tenant-row"]');
  });

  it('GET v1/organizations — returns items (provider)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('platform', 'v1/organizations', { visitUrl: '/provider/organizations' });
  });
});

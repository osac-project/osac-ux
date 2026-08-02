/**
 * API Coverage — models domain
 * Routes: maas_instances, maas_catalog_items, ai_environments
 */

describe('[models]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/maas_instances — returns items', () => {
    cy.trackApi('models', 'v1/maas_instances', { visitUrl: '/models' });
    cy.checkField('models', 'MaaSListPage', 'Model rows', '.pf-v5-c-table tbody tr, [data-testid="model-row"]');
  });

  it('GET v1/maas_catalog_items — returns items', () => {
    cy.trackApi('models', 'v1/maas_catalog_items', { visitUrl: '/catalog' });
  });

  it('GET v1/ai_environments — returns items (provider AI setup)', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('models', 'v1/ai_environments', { visitUrl: '/provider/ai-setup' });
    cy.checkField('models', 'ProviderAiSetupPage', 'AI environment rows', '.pf-v5-c-table tbody tr, [data-testid="ai-env-row"]');
  });
});

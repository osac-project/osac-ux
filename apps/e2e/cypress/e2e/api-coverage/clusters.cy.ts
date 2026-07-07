/**
 * API Coverage — clusters domain
 * Routes: clusters, cluster_templates, cluster_catalog_items
 */

describe('[clusters]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/clusters — returns items', () => {
    cy.trackApi('clusters', 'v1/clusters', { visitUrl: '/clusters' });
    cy.checkField('clusters', 'ClustersPage', 'Cluster list rows', '.pf-v5-c-table tbody tr, [data-testid="cluster-row"]');
  });

  it('GET v1/cluster_catalog_items — returns items', () => {
    cy.trackApi('clusters', 'v1/cluster_catalog_items', { visitUrl: '/catalog' });
  });

  it('GET v1/cluster_templates — returns items', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('clusters', 'v1/cluster_templates', { visitUrl: '/provider/templates' });
  });
});

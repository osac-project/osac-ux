/**
 * API Coverage — compute domain
 * Routes: compute_instances, compute_instance_templates,
 *         compute_instance_catalog_items, instance_types
 */

describe('[compute]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/compute_instances — returns items', () => {
    cy.trackApi('compute', 'v1/compute_instances', { visitUrl: '/vms' });
    cy.checkField('compute', 'VmListPage', 'VM list rows', '.pf-v5-c-table tbody tr, [data-testid="vm-row"]');
  });

  it('GET v1/instance_types — returns items (VM create form)', () => {
    cy.trackApi('compute', 'v1/instance_types', { visitUrl: '/vms/create' });
    cy.checkField('compute', 'VmCreatePage', 'Instance type options', 'select option, [data-testid="instance-type-option"], .pf-v5-c-select__menu-item');
  });

  it('GET v1/compute_instance_catalog_items — returns items', () => {
    cy.trackApi('compute', 'v1/compute_instance_catalog_items', { visitUrl: '/catalog' });
    cy.checkField('compute', 'CatalogPage', 'Compute catalog cards', '[data-testid="catalog-item"], .pf-v5-c-card');
  });

  it('GET v1/compute_instance_templates — returns items', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('compute', 'v1/compute_instance_templates', { visitUrl: '/provider/templates' });
    cy.checkField('compute', 'ProviderTemplatesPage', 'VM template rows', '.pf-v5-c-table tbody tr, [data-testid="template-row"]');
  });
});

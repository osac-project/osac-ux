/**
 * API Coverage — baremetal domain
 * Routes: baremetal_instances, baremetal_instance_templates,
 *         baremetal_instance_catalog_items, host_types
 */

describe('[baremetal]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/baremetal_instances — returns items', () => {
    cy.trackApi('baremetal', 'v1/baremetal_instances', { visitUrl: '/bare-metal' });
    cy.checkField('baremetal', 'BareMetalListPage', 'Bare metal list rows', '.pf-v5-c-table tbody tr, [data-testid="bm-row"]');
  });

  it('GET v1/host_types — returns items (baremetal create form)', () => {
    cy.trackApi('baremetal', 'v1/host_types', { visitUrl: '/bare-metal/create' });
    cy.checkField('baremetal', 'BareMetalCreatePage', 'Host type options', 'select option, [data-testid="host-type-option"], .pf-v5-c-select__menu-item');
  });

  it('GET v1/baremetal_instance_catalog_items — returns items', () => {
    cy.trackApi('baremetal', 'v1/baremetal_instance_catalog_items', { visitUrl: '/catalog' });
  });

  it('GET v1/baremetal_instance_templates — returns items', function () {
    if (!Cypress.env('keycloak_provider_user')) return this.skip();
    cy.realLogin(Cypress.env('keycloak_provider_user'), Cypress.env('keycloak_provider_pass'));
    cy.trackApi('baremetal', 'v1/baremetal_instance_templates', { visitUrl: '/provider/templates' });
  });
});

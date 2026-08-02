export {};

/**
 * Functional flows — tenant-user / networking
 *
 * Covers:
 *  - Virtual Network creation (happy path)
 *  - Subnet creation under a newly created VNet (happy path)
 *
 * Preflight guard: skips the entire suite when no network classes exist in the
 * backend, since the VNet creation form cannot be submitted without one.
 *
 * Cleanup: all created resources are deleted via direct API calls in afterEach
 * so the environment is left clean even on test failure.
 */

const PERSONA = 'tenantUser';
const USER = () => Cypress.env('keycloak_user') as string;
const PASS = () => Cypress.env('keycloak_pass') as string;

const ts = () => Date.now();

describe(`[flows] ${PERSONA} / networking`, () => {
  let networkClassId: string;

  before(function () {
    // Preflight: need at least one network class or VNet creation is blocked.
    cy.realLogin(USER(), PASS());
    cy.request({
      url: '/api/fulfillment/v1/network_classes',
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      const items: { id: string }[] = body?.items ?? body ?? [];
      if (status !== 200 || !items.length) {
        cy.log('No network classes available — skipping networking flows');
        this.skip();
      } else {
        networkClassId = items[0].id;
      }
    });
  });

  beforeEach(() => cy.realLogin(USER(), PASS()));

  // ── Virtual Network ─────────────────────────────────────────────────────────

  describe('Virtual Network', () => {
    let createdVnetId: string | undefined;

    afterEach(() => {
      if (createdVnetId) cy.deleteResource('v1/virtual_networks', createdVnetId);
      createdVnetId = undefined;
    });

    it('creates a virtual network and redirects to the networks list', () => {
      const name = `cy-vnet-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/virtual_networks').as('createVnet');
      cy.visit('/networks/new');

      // Fill name
      cy.get('#vnet-name').type(name);

      // Select the first network class via the PatternFly MenuToggle
      cy.get('button.pf-v5-c-menu-toggle').first().click();
      cy.get('.pf-v5-c-menu__list li').first().click();

      // Submit
      cy.get('#vnet-create-form button[type="submit"]').click();

      cy.wait('@createVnet', { timeout: 15000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdVnetId = response?.body?.id as string;
        expect(createdVnetId).to.be.a('string').and.not.be.empty;
      });

      cy.url().should('include', '/networks');
    });
  });

  // ── Subnet ──────────────────────────────────────────────────────────────────

  describe('Subnet', () => {
    let createdVnetId: string | undefined;
    let createdSubnetId: string | undefined;

    afterEach(() => {
      // Subnet must be deleted before its parent VNet
      if (createdSubnetId) cy.deleteResource('v1/subnets', createdSubnetId);
      if (createdVnetId) cy.deleteResource('v1/virtual_networks', createdVnetId);
      createdSubnetId = undefined;
      createdVnetId = undefined;
    });

    it('creates a subnet under a new virtual network and redirects to subnets tab', () => {
      const vnetName = `cy-vnet-${ts()}`;
      const subnetName = `cy-subnet-${ts()}`;

      // Step 1: create a parent VNet via API so the subnet form has a parent
      cy.request({
        method: 'POST',
        url: '/api/fulfillment/v1/virtual_networks',
        body: { metadata: { name: vnetName }, spec: { network_class: networkClassId } },
        failOnStatusCode: true,
      }).then(({ body }) => {
        createdVnetId = body.id as string;

        // Step 2: create subnet via the UI (pre-select VNet via ?vnetId= to bypass the Select)
        cy.intercept('POST', '/api/fulfillment/v1/subnets').as('createSubnet');
        cy.visit(`/networks/subnets/new?vnetId=${createdVnetId}`);

        cy.get('#subnet-name').type(subnetName);
        cy.get('#subnet-cidr').type('10.10.1.0/24');

        cy.get('#subnet-create-form button[type="submit"]').click();

        cy.wait('@createSubnet', { timeout: 15000 }).then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          createdSubnetId = response?.body?.id as string;
          expect(createdSubnetId).to.be.a('string').and.not.be.empty;
        });

        cy.url().should('include', '/networks').and('include', 'tab=subnets');
      });
    });
  });
});

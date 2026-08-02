export {};

/**
 * Functional flows — tenant-user / virtual machines
 *
 * Covers:
 *  - VM creation via the 5-step provision wizard (catalog → general → configuration → networking → review)
 *
 * Preflight guards:
 *  - Skips when no VM catalog items exist
 *  - Skips when no network classes exist (VNet pre-creation required for networking step)
 *
 * Strategy:
 *  - Catalog item pre-selected via deep-link URL param (/vms/create/:catalogItemId)
 *  - VNet + Subnet created via API in before() so the networking step has selectable options
 *  - Instance type: click the first available radio in the configuration step
 *  - Cleanup: delete VM → Subnet → VNet in after()
 */

const PERSONA = 'tenantUser';
const USER = () => Cypress.env('keycloak_user') as string;
const PASS = () => Cypress.env('keycloak_pass') as string;

const ts = () => Date.now();

// Dummy SSH public key for tests where it is required
const DUMMY_SSH_KEY =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC3 cypress-test-key';

describe(`[flows] ${PERSONA} / virtual machines`, () => {
  let catalogItemId: string;
  let networkClassId: string;
  let vnetId: string;
  let subnetId: string;
  let createdVmId: string | undefined;

  const vnetName = `cy-vm-vnet-${ts()}`;
  const subnetName = `cy-vm-subnet-${ts()}`;

  before(function () {
    cy.realLogin(USER(), PASS());

    // Check VM catalog items
    cy.request({ url: '/api/fulfillment/v1/compute_instance_catalog_items', failOnStatusCode: false })
      .then(({ status, body }) => {
        const items: { id: string }[] = body?.items ?? body ?? [];
        if (status !== 200 || !items.length) {
          cy.log('No VM catalog items — skipping vm flows');
          this.skip();
        } else {
          catalogItemId = items[0].id;
        }
      });

    // Check network classes (needed to create the test VNet)
    cy.request({ url: '/api/fulfillment/v1/network_classes', failOnStatusCode: false })
      .then(({ status, body }) => {
        const items: { id: string }[] = body?.items ?? body ?? [];
        if (status !== 200 || !items.length) {
          cy.log('No network classes — skipping vm flows');
          this.skip();
        } else {
          networkClassId = items[0].id;
        }
      });

    // Create a dedicated VNet for the networking step
    cy.request({
      method: 'POST',
      url: '/api/fulfillment/v1/virtual_networks',
      body: { metadata: { name: vnetName }, spec: { network_class: networkClassId } },
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      if (status !== 200) {
        cy.log(`VNet creation failed (${status}) — skipping vm flows`);
        this.skip();
      }
      vnetId = body.id as string;

      // Create a subnet under the VNet
      cy.request({
        method: 'POST',
        url: '/api/fulfillment/v1/subnets',
        body: {
          metadata: { name: subnetName },
          spec: { virtual_network_id: vnetId, ipv4_cidr: '10.11.0.0/24' },
        },
        failOnStatusCode: false,
      }).then(({ status: s2, body: b2 }) => {
        if (s2 !== 200) {
          cy.log(`Subnet creation failed (${s2}) — skipping vm flows`);
          this.skip();
        }
        subnetId = b2.id as string;
      });
    });
  });

  after(() => {
    if (createdVmId) cy.deleteResource('v1/compute_instances', createdVmId);
    if (subnetId) cy.deleteResource('v1/subnets', subnetId);
    if (vnetId) cy.deleteResource('v1/virtual_networks', vnetId);
  });

  beforeEach(() => cy.realLogin(USER(), PASS()));

  describe('VM creation wizard', () => {
    it('creates a VM through the 5-step wizard and redirects to VMs list', function () {
      const vmName = `cy-vm-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/compute_instances').as('createVm');

      // Step 1 — Catalog (pre-selected via deep link)
      cy.visit(`/vms/create/${catalogItemId}`);
      // Wait until the catalog card is rendered and selected
      cy.get(`#catalog-item-card-${catalogItemId}`, { timeout: 15000 }).should('exist');
      cy.contains('button', 'Next').click();

      // Step 2 — General
      cy.get('#metadata-name', { timeout: 10000 }).clear().type(vmName);
      // Fill SSH key if the field is present (may not be required on all catalog items)
      cy.get('body').then(($body) => {
        if ($body.find('#spec-sshKey').length) {
          cy.get('#spec-sshKey').clear().type(DUMMY_SSH_KEY);
        }
      });
      cy.contains('button', 'Next').click();

      // Step 3 — Configuration (instance type)
      // Auto-selects if only 1 type; otherwise click the first radio
      cy.get('input[name="spec.instanceType"]', { timeout: 10000 })
        .first()
        .then(($radio) => {
          if (!$radio.prop('checked')) cy.wrap($radio).click({ force: true });
        });
      cy.contains('button', 'Next').click();

      // Step 4 — Networking: select our pre-created VNet + Subnet
      cy.contains('label', /Virtual network/i, { timeout: 10000 })
        .closest('.pf-v5-c-form__group')
        .find('button.pf-v5-c-menu-toggle')
        .click();
      cy.contains('.pf-v5-c-menu__list li', vnetName, { timeout: 10000 }).click();

      // Subnet list loads after VNet selection
      cy.contains('label', /Subnet/i, { timeout: 10000 })
        .closest('.pf-v5-c-form__group')
        .find('button.pf-v5-c-menu-toggle')
        .click();
      cy.contains('.pf-v5-c-menu__list li', subnetName, { timeout: 10000 }).click();

      cy.contains('button', 'Next').click();

      // Step 5 — Review: click Create
      cy.contains('button', 'Create', { timeout: 10000 }).click();

      cy.wait('@createVm', { timeout: 30000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdVmId = response?.body?.id as string;
        expect(createdVmId).to.be.a('string').and.not.be.empty;
      });

      cy.url({ timeout: 15000 }).should('match', /\/vms\/[^/]+/);
    });
  });
});

export {};

/**
 * Functional flows — tenant-user / bare metal
 *
 * Covers:
 *  - Bare Metal instance creation via the 4-step provision wizard
 *    (catalog → general → configuration → review)
 *
 * Preflight guard: skips when no bare metal catalog items exist.
 *
 * Steps:
 *  1. Catalog — pre-selected via deep-link URL param
 *  2. General  — `#bm-name` (required), run strategy select (optional)
 *  3. Configuration — `#bm-ssh-key` (optional), `#bm-user-data` (optional)
 *  4. Review   — click Create
 *
 * Cleanup: created instance deleted via direct API call in after().
 */

const PERSONA = 'tenantUser';
const USER = () => Cypress.env('keycloak_user') as string;
const PASS = () => Cypress.env('keycloak_pass') as string;

const ts = () => Date.now();

const DUMMY_SSH_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC3 cypress-test-key';

describe(`[flows] ${PERSONA} / bare metal`, () => {
  let catalogItemId: string;
  let createdBmId: string | undefined;

  before(function () {
    cy.realLogin(USER(), PASS());

    cy.request({
      url: '/api/fulfillment/v1/baremetal_instance_catalog_items',
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      const items: { id: string }[] = body?.items ?? body ?? [];
      if (status !== 200 || !items.length) {
        cy.log('No bare metal catalog items — skipping bare metal flows');
        this.skip();
      } else {
        catalogItemId = items[0].id;
      }
    });
  });

  after(() => {
    if (createdBmId) cy.deleteResource('v1/baremetal_instances', createdBmId);
  });

  beforeEach(() => cy.realLogin(USER(), PASS()));

  describe('Bare Metal creation wizard', () => {
    it('creates a bare metal instance through the 4-step wizard', function () {
      const bmName = `cy-bm-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/baremetal_instances').as('createBm');

      // Step 1 — Catalog (pre-selected via deep link)
      cy.visit(`/bare-metal/create/${catalogItemId}`);
      cy.get(`#catalog-item-card-${catalogItemId}`, { timeout: 15000 }).should('exist');
      cy.contains('button', 'Next').click();

      // Step 2 — General
      cy.get('#bm-name', { timeout: 10000 }).clear().type(bmName);
      // Run strategy has a default — no interaction needed
      cy.contains('button', 'Next').click();

      // Step 3 — Configuration (SSH key and user data are optional)
      cy.get('body').then(($body) => {
        if ($body.find('#bm-ssh-key').length) {
          cy.get('#bm-ssh-key').type(DUMMY_SSH_KEY);
        }
      });
      cy.contains('button', 'Next', { timeout: 10000 }).click();

      // Step 4 — Review
      cy.contains('button', 'Create', { timeout: 10000 }).click();

      cy.wait('@createBm', { timeout: 30000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdBmId = response?.body?.id as string;
        expect(createdBmId).to.be.a('string').and.not.be.empty;
      });

      cy.url({ timeout: 15000 }).should('match', /\/bare-metal\/[^/]+|\/bare-metal/);
    });
  });
});

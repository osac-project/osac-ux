export {};

/**
 * Functional flows — tenant-user / storage
 *
 * Covers:
 *  - Block Volume creation (happy path)
 *
 * No preflight guard needed: the block volume form uses a fixed enum for storage
 * class (ssd/nvme/standard) and has no backend dependencies before submitting.
 *
 * Cleanup: created volume deleted via direct API call in afterEach.
 */

const PERSONA = 'tenantUser';
const USER = () => Cypress.env('keycloak_user') as string;
const PASS = () => Cypress.env('keycloak_pass') as string;

const ts = () => Date.now();

describe(`[flows] ${PERSONA} / storage`, () => {
  beforeEach(() => cy.realLogin(USER(), PASS()));

  describe('Block Volume', () => {
    let createdVolumeId: string | undefined;

    afterEach(() => {
      if (createdVolumeId) cy.deleteResource('v1/block_volumes', createdVolumeId);
      createdVolumeId = undefined;
    });

    it('creates a block volume with default storage class and redirects to volumes list', () => {
      const name = `cy-vol-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/block_volumes').as('createVolume');
      cy.visit('/storage/volumes/new');

      cy.get('#vol-name').type(name);

      // Size is pre-filled (50 GiB default) — leave it as is.
      // Storage class defaults to 'ssd' — no selection needed.

      cy.get('#vol-create-form button[type="submit"]').click();

      cy.wait('@createVolume', { timeout: 15000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdVolumeId = response?.body?.id as string;
        expect(createdVolumeId).to.be.a('string').and.not.be.empty;
      });

      cy.url().should('include', '/storage/volumes');
    });

    it('creates a block volume with NVMe storage class', () => {
      const name = `cy-vol-nvme-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/block_volumes').as('createVolume');
      cy.visit('/storage/volumes/new');

      cy.get('#vol-name').type(name);

      // Change storage class from default 'ssd' to 'nvme'
      cy.get('button.pf-v5-c-menu-toggle').first().click();
      cy.contains('.pf-v5-c-menu__list li', 'NVMe').click();

      cy.get('#vol-create-form button[type="submit"]').click();

      cy.wait('@createVolume', { timeout: 15000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdVolumeId = response?.body?.id as string;
        expect(createdVolumeId).to.be.a('string').and.not.be.empty;
        expect(response?.body?.spec?.storageClass ?? response?.body?.storageClass).to.eq('nvme');
      });

      cy.url().should('include', '/storage/volumes');
    });
  });
});

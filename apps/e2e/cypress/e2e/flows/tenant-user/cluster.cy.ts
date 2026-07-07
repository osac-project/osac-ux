export {};

/**
 * Functional flows — tenant-user / clusters
 *
 * Covers:
 *  - Cluster creation via the 5-step provision wizard
 *    (catalog → general → configuration → networking → review)
 *
 * Preflight guard: skips when no cluster catalog items exist.
 *
 * Required field note:
 *  - Cluster name: `#cluster-name`
 *  - Pull secret: `#cluster-pull-secret` (JSON format required by the backend)
 *  - Configuration parameters vary by template — unknown params are skipped
 *  - Networking CIDRs are optional (defaults come from the template)
 *
 * Cleanup: created cluster deleted via direct API call in after().
 */

const PERSONA = 'tenantUser';
const USER = () => Cypress.env('keycloak_user') as string;
const PASS = () => Cypress.env('keycloak_pass') as string;

const ts = () => Date.now();

// Minimal Red Hat pull secret format — replace with a real one in cypress.env.json
// if the backend validates the content. A placeholder will pass UI validation.
const DUMMY_PULL_SECRET = JSON.stringify({
  auths: { 'registry.example.com': { auth: Buffer.from('user:pass').toString('base64') } },
});

describe(`[flows] ${PERSONA} / clusters`, () => {
  let catalogItemId: string;
  let createdClusterId: string | undefined;

  before(function () {
    cy.realLogin(USER(), PASS());

    cy.request({ url: '/api/fulfillment/v1/cluster_catalog_items', failOnStatusCode: false })
      .then(({ status, body }) => {
        const items: { id: string }[] = body?.items ?? body ?? [];
        if (status !== 200 || !items.length) {
          cy.log('No cluster catalog items — skipping cluster flows');
          this.skip();
        } else {
          catalogItemId = items[0].id;
        }
      });
  });

  after(() => {
    if (createdClusterId) cy.deleteResource('v1/clusters', createdClusterId);
  });

  beforeEach(() => cy.realLogin(USER(), PASS()));

  describe('Cluster creation wizard', () => {
    it('creates a cluster through the 5-step wizard and redirects to clusters list', function () {
      const clusterName = `cy-cluster-${ts()}`;

      cy.intercept('POST', '/api/fulfillment/v1/clusters').as('createCluster');

      // Step 1 — Catalog (pre-selected via deep link)
      cy.visit(`/clusters/create/${catalogItemId}`);
      cy.get(`#catalog-item-card-${catalogItemId}`, { timeout: 15000 }).should('exist');
      cy.contains('button', 'Next').click();

      // Step 2 — General
      cy.get('#cluster-name', { timeout: 10000 }).clear().type(clusterName);
      cy.get('#cluster-pull-secret').clear().type(DUMMY_PULL_SECRET, { delay: 0 });
      cy.contains('button', 'Next').click();

      // Step 3 — Configuration (template params are environment-specific; leave at defaults)
      cy.contains('button', 'Next', { timeout: 10000 }).click();

      // Step 4 — Networking (CIDRs are optional — leave at defaults)
      cy.contains('button', 'Next', { timeout: 10000 }).click();

      // Step 5 — Review
      cy.contains('button', 'Create', { timeout: 10000 }).click();

      cy.wait('@createCluster', { timeout: 60000 }).then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        createdClusterId = response?.body?.id as string;
        expect(createdClusterId).to.be.a('string').and.not.be.empty;
      });

      // After creation the app navigates to the cluster detail or list
      cy.url({ timeout: 15000 }).should('include', '/clusters');
    });
  });
});

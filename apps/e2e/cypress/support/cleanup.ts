/**
 * cy.deleteResource — delete a backend resource by route + ID via a direct API
 * DELETE call. Used in afterEach hooks to clean up resources created during tests.
 *
 * Uses the same session cookies as the browser, so no separate auth is needed.
 * failOnStatusCode is false so a 404 (already deleted) doesn't break cleanup.
 *
 * Usage:
 *   cy.deleteResource('v1/virtual_networks', id)
 *   cy.deleteResource('v1/compute_instances', id)
 */
Cypress.Commands.add('deleteResource', (route: string, id: string) => {
  cy.request({
    method: 'DELETE',
    url: `/api/fulfillment/${route}/${id}`,
    failOnStatusCode: false,
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Delete a backend resource via direct API call.
       * Safe to call even if the resource was never created (id undefined/empty is a no-op).
       */
      deleteResource(route: string, id: string): Chainable<void>;
    }
  }
}

export {};

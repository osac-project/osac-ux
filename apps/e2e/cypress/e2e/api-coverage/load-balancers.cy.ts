/**
 * API Coverage — load-balancers domain
 * Routes: load_balancers
 */

describe('[load-balancers]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/load_balancers — returns items', () => {
    cy.trackApi('load-balancers', 'v1/load_balancers', { visitUrl: '/load-balancers' });
    cy.checkField('load-balancers', 'LoadBalancersPage', 'Load balancer rows', '.pf-v5-c-table tbody tr, [data-testid="lb-row"]');
  });
});

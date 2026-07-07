/**
 * API Coverage — projects domain
 * Routes: projects, project_memberships
 */

describe('[projects]', () => {
  beforeEach(() => cy.realLogin());

  it('GET v1/projects — returns items', () => {
    cy.trackApi('projects', 'v1/projects', { visitUrl: '/projects' });
    cy.checkField('projects', 'ProjectsListPage', 'Project rows', '.pf-v5-c-table tbody tr, [data-testid="project-row"]');
  });

  it('GET v1/project_memberships — returns items', () => {
    cy.trackApi('projects', 'v1/project_memberships', { visitUrl: '/projects' });
  });
});

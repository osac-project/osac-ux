/**
 * API Coverage — iam domain
 * Routes: users, roles, role_bindings, identity_providers
 *
 * These endpoints require the tenantAdmin role.
 */

describe('[iam]', () => {
  beforeEach(() =>
    cy.realLogin(
      Cypress.env('keycloak_admin_user') ?? Cypress.env('keycloak_user') ?? 'admin',
      Cypress.env('keycloak_admin_pass') ?? Cypress.env('keycloak_pass') ?? 'admin',
    ),
  );

  it('GET v1/users — returns items', () => {
    cy.trackApi('iam', 'v1/users', { visitUrl: '/admin/users' });
    cy.checkField('iam', 'AdminUsersPage', 'User rows', '.pf-v5-c-table tbody tr, [data-testid="user-row"]');
  });

  it('GET v1/role_bindings — returns items', () => {
    cy.trackApi('iam', 'v1/role_bindings', { visitUrl: '/admin/role-bindings' });
    cy.checkField('iam', 'AdminRoleBindingsPage', 'Role binding rows', '.pf-v5-c-table tbody tr, [data-testid="rolebinding-row"]');
  });

  it('GET v1/identity_providers — returns items', () => {
    cy.trackApi('iam', 'v1/identity_providers', { visitUrl: '/admin/identity-providers' });
    cy.checkField('iam', 'AdminIdentityProvidersPage', 'Identity provider rows', '.pf-v5-c-table tbody tr, [data-testid="idp-row"]');
  });

  it('GET v1/roles — returns items (role assignment form)', () => {
    cy.trackApi('iam', 'v1/roles', { visitUrl: '/admin/role-bindings/assign' });
    cy.checkField('iam', 'AdminRoleBindingAssignPage', 'Roles select options', 'select option:not([disabled]), [data-testid="role-option"]');
  });
});

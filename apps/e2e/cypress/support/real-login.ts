/**
 * cy.realLogin — authenticate against the real Keycloak using the Resource Owner
 * Password Credentials grant and inject the resulting tokens as the three session
 * cookies the Go BFF proxy reads (osac-access, osac-refresh, osac-id).
 *
 * This avoids the full browser-based OIDC redirect while keeping the session
 * mechanism completely unchanged on the server side.
 *
 * Usage:
 *   cy.realLogin()              // uses Cypress.env('keycloak_user') / 'keycloak_pass'
 *   cy.realLogin('admin', 'pw') // explicit credentials
 */

const DEFAULT_USER = () => Cypress.env('keycloak_user') ?? 'admin';
const DEFAULT_PASS = () => Cypress.env('keycloak_pass') ?? 'admin';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Derive the Keycloak token endpoint from the authorize URL returned by the
 * proxy's GET /api/login endpoint.
 *
 * The authorize URL looks like:
 *   https://keycloak-.../realms/{realm}/protocol/openid-connect/auth?...
 * The token endpoint is:
 *   https://keycloak-.../realms/{realm}/protocol/openid-connect/token
 */
function tokenEndpointFromAuthorizeUrl(authorizeUrl: string): string {
  const url = new URL(authorizeUrl);
  // Replace the path segment: .../auth → .../token
  url.pathname = url.pathname.replace(/\/auth$/, '/token');
  url.search = '';
  return url.toString();
}

Cypress.Commands.add('realLogin', (username?: string, password?: string) => {
  const user = username ?? DEFAULT_USER();
  const pass = password ?? DEFAULT_PASS();

  cy.session(
    [user, pass],
    () => {
      // Step 1: Ask the proxy where Keycloak lives (discovers realm + issuer).
      cy.request({
        method: 'GET',
        url: `/api/login?redirect_base=${encodeURIComponent(Cypress.config('baseUrl') ?? 'http://localhost:5173')}`,
        failOnStatusCode: true,
      }).then(({ body }: { body: { url: string } }) => {
        const tokenUrl = tokenEndpointFromAuthorizeUrl(body.url);

        // Step 2: Exchange credentials for tokens via the password grant.
        cy.request<KeycloakTokenResponse>({
          method: 'POST',
          url: tokenUrl,
          form: true,
          body: {
            grant_type: 'password',
            client_id: 'osac-ui',
            username: user,
            password: pass,
            scope: 'openid',
          },
          // The lab Keycloak may use a self-signed cert; cy.request follows
          // NODE_TLS_REJECT_UNAUTHORIZED set in cypress.config.ts.
          failOnStatusCode: true,
        }).then(({ body: tokens }) => {
          // Step 3: Inject the three cookies the proxy reads for every request.
          cy.setCookie('osac-access', tokens.access_token, { path: '/' });
          if (tokens.refresh_token) {
            cy.setCookie('osac-refresh', tokens.refresh_token, { path: '/' });
          }
          if (tokens.id_token) {
            cy.setCookie('osac-id', tokens.id_token, { path: '/' });
          }
        });
      });
    },
    {
      // Re-use the session across tests in the same spec; validate that the
      // access cookie still exists before skipping the login step.
      validate() {
        cy.getCookie('osac-access').should('exist');
      },
    },
  );
});

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Authenticate with Keycloak using the password grant and inject the
       * resulting tokens as session cookies.
       *
       * Credentials default to `Cypress.env('keycloak_user')` / `keycloak_pass`.
       */
      realLogin(username?: string, password?: string): Chainable<void>;
    }
  }
}

export {};

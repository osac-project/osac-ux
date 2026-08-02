/**
 * API Coverage reporting helpers.
 *
 * cy.trackApi(domain, route)
 *   Intercepts GET /api/fulfillment/v1/<route>, waits for the response, checks items.length,
 *   and records the result via cy.task('appendResult') into the Node-side accumulator.
 *
 * cy.checkField(domain, page, fieldLabel, selector)
 *   Asserts the element exists and contains non-empty text (or has children),
 *   recording any gap via cy.task('appendFieldGap').
 *
 * The Node-side accumulator survives across cy.visit() calls. _report.cy.ts
 * reads it via cy.task('getReport') and writes it to disk.
 */

export interface ApiResult {
  domain: string;
  route: string;
  op: 'list';
  status: 'ok' | 'empty' | 'failed' | 'notCalled';
  itemCount: number;
  httpStatus: number | null;
}

export interface FieldGap {
  domain: string;
  page: string;
  field: string;
  status: 'ok' | 'empty' | 'missing';
}

export interface ApiReport {
  apiResults: ApiResult[];
  fieldGaps: FieldGap[];
}

// ---------------------------------------------------------------------------
// cy.trackApi
// ---------------------------------------------------------------------------

Cypress.Commands.add('trackApi', (domain: string, route: string, options?: { visitUrl?: string }) => {
  const alias = `api_${domain}_${route.replace(/\//g, '_')}`;
  const pattern = `**/api/fulfillment/${route}**`;

  // Register the intercept FIRST so it is in place before any navigation fires
  // the request. If visitUrl is provided we visit here; otherwise the caller is
  // responsible for visiting before calling trackApi.
  cy.intercept('GET', pattern).as(alias);

  if (options?.visitUrl) {
    cy.visit(options.visitUrl);
  }
  cy.wait(`@${alias}`, { timeout: 15_000 }).then((interception) => {
    const httpStatus = interception.response?.statusCode ?? null;
    const body = interception.response?.body;

    let status: ApiResult['status'];
    let itemCount = 0;

    if (httpStatus === null) {
      status = 'notCalled';
    } else if (httpStatus >= 400) {
      status = 'failed';
    } else {
      // Support both { items: [...] } and plain arrays.
      const items: unknown[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.items)
          ? body.items
          : [];
      itemCount = items.length;
      status = itemCount > 0 ? 'ok' : 'empty';
    }

    const result: ApiResult = { domain, route, op: 'list', status, itemCount, httpStatus };
    // Store in the Node-side accumulator so it survives across cy.visit() calls.
    cy.task('appendResult', result);
  });
});

// ---------------------------------------------------------------------------
// cy.checkField
// ---------------------------------------------------------------------------

Cypress.Commands.add(
  'checkField',
  (domain: string, page: string, field: string, selector: string) => {
    cy.get('body').then(($body) => {
      const $el = $body.find(selector);

      let status: FieldGap['status'];

      if ($el.length === 0) {
        status = 'missing';
      } else {
        const text = $el.text().trim();
        const hasChildren = $el.children().length > 0;
        status = text.length > 0 || hasChildren ? 'ok' : 'empty';
      }

      cy.task('appendFieldGap', { domain, page, field, status });
    });
  },
);

// ---------------------------------------------------------------------------
// TypeScript declarations
// ---------------------------------------------------------------------------

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Intercept GET /api/fulfillment/v1/<route>, wait for the response,
       * and record the result (ok / empty / failed) via cy.task('appendResult').
       *
       * Pass { visitUrl } to have the intercept registered before visiting,
       * which is required when the page fires the request immediately on mount.
       * Otherwise call cy.visit() before cy.trackApi().
       */
      trackApi(domain: string, route: string, options?: { visitUrl?: string }): Chainable<void>;

      /**
       * Assert that `selector` is visible and non-empty; record the outcome
       * as a field gap entry for the given domain / page / field combination.
       */
      checkField(
        domain: string,
        page: string,
        field: string,
        selector: string,
      ): Chainable<void>;
    }
  }
}

export {};

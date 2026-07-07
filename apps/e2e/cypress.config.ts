import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { defineConfig } from 'cypress';

import type { ApiResult, FieldGap } from './cypress/support/api-report';

// Allow cy.request to reach Keycloak even when it uses a self-signed certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Node-side accumulator — survives across cy.visit() calls because it lives in
// the Cypress Node process, not in the browser window.
const nodeReport: { apiResults: ApiResult[]; fieldGaps: FieldGap[] } = {
  apiResults: [],
  fieldGaps: [],
};

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on) {
      on('task', {
        appendResult(result: ApiResult) {
          const existing = nodeReport.apiResults.findIndex(
            (r) => r.domain === result.domain && r.route === result.route,
          );
          if (existing >= 0) {
            nodeReport.apiResults[existing] = result;
          } else {
            nodeReport.apiResults.push(result);
          }
          return null;
        },

        appendFieldGap(gap: FieldGap) {
          nodeReport.fieldGaps.push(gap);
          return null;
        },

        getReport() {
          return nodeReport;
        },

        writeReport(report: unknown) {
          const outPath = resolve(__dirname, 'cypress', 'api-coverage-report.json');
          writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
          return outPath;
        },
      });
    },
  },
})

/**
 * API Coverage — final report writer
 *
 * This spec is named with a leading "_" so that Cypress runs it last
 * (alphabetical ordering puts "_" after all letter prefixes in most runners).
 *
 * It reads the Node-side accumulator (populated via cy.task('appendResult')
 * in each domain spec) and writes the final JSON to
 * cypress/api-coverage-report.json via cy.task('writeReport').
 *
 * Run the full suite with:
 *   pnpm cypress run --spec 'cypress/e2e/api-coverage/**'
 */

import type { ApiReport, ApiResult, FieldGap } from '../../support/api-report';

interface DomainSummary {
  ok: number;
  empty: number;
  failed: number;
  notCalled: number;
}

interface ReportOutput {
  generatedAt: string;
  apiResults: ApiResult[];
  fieldGaps: FieldGap[];
  summary: {
    byDomain: Record<string, DomainSummary>;
    totalApis: number;
    ok: number;
    empty: number;
    failed: number;
    notCalled: number;
    fieldGapsCount: number;
  };
}

function buildSummary(report: ApiReport): ReportOutput['summary'] {
  const byDomain: Record<string, DomainSummary> = {};

  for (const r of report.apiResults) {
    if (!byDomain[r.domain]) {
      byDomain[r.domain] = { ok: 0, empty: 0, failed: 0, notCalled: 0 };
    }
    byDomain[r.domain][r.status]++;
  }

  const totals = report.apiResults.reduce(
    (acc, r) => {
      acc[r.status]++;
      acc.totalApis++;
      return acc;
    },
    { totalApis: 0, ok: 0, empty: 0, failed: 0, notCalled: 0 },
  );

  return {
    byDomain,
    ...totals,
    fieldGapsCount: report.fieldGaps.length,
  };
}

describe('[api-coverage] write report', () => {
  it('reads Node-side accumulator, computes summary, and writes report file', () => {
    cy.task<ApiReport>('getReport').then((rawReport) => {
      const output: ReportOutput = {
        generatedAt: new Date().toISOString(),
        apiResults: rawReport.apiResults,
        fieldGaps: rawReport.fieldGaps,
        summary: buildSummary(rawReport),
      };

      cy.task('writeReport', output).then((outPath) => {
        cy.log(`Report written to: ${outPath}`);
      });

      const { summary } = output;
      cy.log(
        `API Coverage: ${summary.ok} ok / ${summary.empty} empty / ` +
          `${summary.failed} failed / ${summary.notCalled} not-called ` +
          `(total ${summary.totalApis}) | field gaps: ${summary.fieldGapsCount}`,
      );
    });
  });
});

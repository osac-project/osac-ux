/**
 * gen-coverage-html.mjs
 *
 * Merges the static API manifest (api-diff-manifest.generated.json produced by
 * gen-api-diff.mjs) with the Cypress runtime results
 * (apps/e2e/cypress/api-coverage-report.json produced by the api-coverage suite)
 * into a self-contained HTML manager report.
 *
 * Output: apps/e2e/cypress/api-coverage-report.html
 *
 * Run:
 *   node scripts/gen-coverage-html.mjs
 * Or as part of the full workflow:
 *   pnpm gen:coverage-report
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const manifestFile = path.join(repoRoot, 'apps/e2e/api-diff-manifest.generated.json')
const cypressReportFile = path.join(repoRoot, 'apps/e2e/cypress/api-coverage-report.json')
const outFile = path.join(repoRoot, 'apps/e2e/cypress/api-coverage-report.html')

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

async function loadData() {
  /** @type {import('../libs/ui-components/src/pages/dev/api-diff-manifest.generated').ApiDiffEntry[]} */
  let manifest = []
  try {
    manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
  } catch {
    console.warn('[gen-coverage-html] Manifest not found — run pnpm gen:api-diff first')
    manifest = []
  }

  let cypressReport = { apiResults: [], fieldGaps: [], summary: {}, generatedAt: null }
  try {
    cypressReport = JSON.parse(await readFile(cypressReportFile, 'utf8'))
  } catch {
    console.warn('[gen-coverage-html] Cypress report not found — runtime columns will be empty')
  }

  return { manifest, cypressReport }
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   route: string,
 *   category: string,
 *   ops: string[],
 *   pages: string[],
 *   isTemp: boolean,
 *   hasMockData: boolean,
 *   hookFile: string|null,
 *   notes: string|null,
 *   runtimeStatus: string,
 *   itemCount: number|null,
 *   httpStatus: number|null,
 * }} MergedRow
 */

function mergeData(manifest, cypressReport) {
  /** @type {Map<string, object>} */
  const runtimeByRoute = new Map()
  for (const r of cypressReport.apiResults ?? []) {
    runtimeByRoute.set(r.route, r)
  }

  /** @type {MergedRow[]} */
  const rows = manifest.map((entry) => {
    const runtime = runtimeByRoute.get(entry.route)
    return {
      route: entry.route,
      category: entry.category,
      ops: entry.ops,
      pages: entry.pages ?? [],
      isTemp: entry.category === 'temp-api',
      hasMockData: entry.hasMockData,
      hookFile: entry.hookFile,
      notes: entry.notes,
      runtimeStatus: runtime?.status ?? 'notTested',
      itemCount: runtime?.itemCount ?? null,
      httpStatus: runtime?.httpStatus ?? null,
    }
  })

  return rows
}

// ---------------------------------------------------------------------------
// Render HTML
// ---------------------------------------------------------------------------

function statusColor(status) {
  return (
    {
      ok: '#1a7f37',
      empty: '#9a6700',
      failed: '#cf222e',
      notCalled: '#6e7781',
      skipped: '#8250df',
      notTested: '#6e7781',
    }[status] ?? '#6e7781'
  )
}

function categoryColor(cat) {
  return cat === 'real' ? '#1a7f37' : cat === 'temp-api' ? '#9a6700' : '#6e7781'
}

function badge(text, color, bg) {
  const bgColor = bg ?? color + '1a'
  return `<span style="display:inline-block;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:600;color:${color};background:${bgColor};border:1px solid ${color}33;white-space:nowrap">${escHtml(text)}</span>`
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderTable(rows) {
  const trs = rows
    .map((r) => {
      const catBadge = badge(r.category, categoryColor(r.category))
      const statusBadge = badge(r.runtimeStatus, statusColor(r.runtimeStatus))
      const opsBadges = r.ops.map((op) => badge(op, '#0969da')).join(' ')
      const pagesList =
        r.pages.length > 0
          ? r.pages.map((p) => `<code style="font-size:11px">${escHtml(p)}</code>`).join('<br>')
          : '<span style="color:#6e7781">—</span>'
      const itemCountCell =
        r.itemCount !== null
          ? `<span style="font-weight:600;color:${r.itemCount > 0 ? '#1a7f37' : '#cf222e'}">${r.itemCount}</span>`
          : '—'
      const httpCell = r.httpStatus !== null ? `<code>${r.httpStatus}</code>` : '—'
      const notesCell = r.notes
        ? `<span title="${escHtml(r.notes)}" style="cursor:help;color:#6e7781;font-size:11px">${escHtml(r.notes.slice(0, 40))}${r.notes.length > 40 ? '…' : ''}</span>`
        : ''

      return `<tr data-category="${escHtml(r.category)}" data-status="${escHtml(r.runtimeStatus)}" data-route="${escHtml(r.route)}">
        <td><code style="font-size:12px">${escHtml(r.route)}</code></td>
        <td>${catBadge}</td>
        <td>${opsBadges || '—'}</td>
        <td style="font-size:12px;line-height:1.6">${pagesList}</td>
        <td>${statusBadge}</td>
        <td style="text-align:center">${itemCountCell}</td>
        <td style="text-align:center">${httpCell}</td>
        <td style="font-size:11px;color:#6e7781">${escHtml(r.hookFile ?? '')}</td>
        <td>${notesCell}</td>
      </tr>`
    })
    .join('\n')

  return trs
}

function renderHtml(rows, cypressReport) {
  const total = rows.length
  const real = rows.filter((r) => r.category === 'real').length
  const temp = rows.filter((r) => r.category === 'temp-api').length
  const ok = rows.filter((r) => r.runtimeStatus === 'ok').length
  const empty = rows.filter((r) => r.runtimeStatus === 'empty').length
  const failed = rows.filter((r) => r.runtimeStatus === 'failed').length
  const notTested = rows.filter((r) => r.runtimeStatus === 'notTested').length
  const generatedAt = cypressReport.generatedAt
    ? new Date(cypressReport.generatedAt).toLocaleString()
    : 'no Cypress run yet'
  const reportedAt = new Date().toLocaleString()

  const tableRows = renderTable(rows)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OSAC API Coverage Map</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; background: #f6f8fa; color: #1f2328; }
  header { background: #24292f; color: #e6edf3; padding: 16px 24px; }
  header h1 { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
  header p  { font-size: 12px; color: #8b949e; }
  .stats { display: flex; gap: 12px; padding: 16px 24px; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #d0d7de; }
  .stat { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 8px 16px; text-align: center; min-width: 90px; }
  .stat .val { font-size: 22px; font-weight: 700; }
  .stat .lbl { font-size: 11px; color: #6e7781; text-transform: uppercase; letter-spacing: .5px; }
  .controls { display: flex; gap: 10px; padding: 12px 24px; background: #fff; border-bottom: 1px solid #d0d7de; flex-wrap: wrap; align-items: center; }
  .controls select, .controls input { padding: 5px 10px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 13px; background: #fff; }
  .controls input { min-width: 220px; }
  .controls label { font-size: 12px; color: #57606a; }
  #rowCount { font-size: 12px; color: #57606a; margin-left: auto; }
  .table-wrap { padding: 16px 24px; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; font-size: 12px; }
  th { background: #f6f8fa; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 1px solid #d0d7de; white-space: nowrap; color: #57606a; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
  td { padding: 7px 12px; border-bottom: 1px solid #eaecef; vertical-align: top; }
  tr:last-child td { border-bottom: 0; }
  tr:hover td { background: #f6f8fa; }
  tr[hidden] { display: none; }
  code { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 3px; padding: 1px 5px; }
  .legend { padding: 8px 24px 16px; font-size: 11px; color: #6e7781; display: flex; gap: 16px; flex-wrap: wrap; }
</style>
</head>
<body>
<header>
  <h1>OSAC API Coverage Map</h1>
  <p>Cypress run: ${escHtml(generatedAt)} &nbsp;|&nbsp; Report generated: ${escHtml(reportedAt)}</p>
</header>

<div class="stats">
  <div class="stat"><div class="val">${total}</div><div class="lbl">Total routes</div></div>
  <div class="stat"><div class="val" style="color:#1a7f37">${real}</div><div class="lbl">Real (proto)</div></div>
  <div class="stat"><div class="val" style="color:#9a6700">${temp}</div><div class="lbl">Temp-API</div></div>
  <div class="stat"><div class="val" style="color:#1a7f37">${ok}</div><div class="lbl">OK (data)</div></div>
  <div class="stat"><div class="val" style="color:#9a6700">${empty}</div><div class="lbl">Empty</div></div>
  <div class="stat"><div class="val" style="color:#cf222e">${failed}</div><div class="lbl">Failed</div></div>
  <div class="stat"><div class="val" style="color:#6e7781">${notTested}</div><div class="lbl">Not tested</div></div>
</div>

<div class="controls">
  <label>Category
    <select id="filterCat" onchange="applyFilters()">
      <option value="all">All</option>
      <option value="real">Real</option>
      <option value="temp-api">Temp-API</option>
      <option value="proto-no-hook">Proto no hook</option>
    </select>
  </label>
  <label>Runtime status
    <select id="filterStatus" onchange="applyFilters()">
      <option value="all">All</option>
      <option value="ok">ok</option>
      <option value="empty">empty</option>
      <option value="failed">failed</option>
      <option value="notCalled">notCalled</option>
      <option value="skipped">skipped</option>
      <option value="notTested">not tested</option>
    </select>
  </label>
  <input id="searchBox" type="search" placeholder="Filter by route or page…" oninput="applyFilters()">
  <span id="rowCount"></span>
</div>

<div class="table-wrap">
<table id="mainTable">
  <thead>
    <tr>
      <th>Route</th>
      <th>Category</th>
      <th>Ops</th>
      <th>UI Pages</th>
      <th>Runtime</th>
      <th>Items</th>
      <th>HTTP</th>
      <th>Hook file</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
${tableRows}
  </tbody>
</table>
</div>

<div class="legend">
  <strong>Status legend:</strong>
  <span style="color:#1a7f37">ok</span> — API returned items
  &nbsp;|&nbsp; <span style="color:#9a6700">empty</span> — API responded 2xx but items[] was empty
  &nbsp;|&nbsp; <span style="color:#cf222e">failed</span> — API returned HTTP 4xx/5xx
  &nbsp;|&nbsp; <span style="color:#6e7781">notCalled</span> — cy.trackApi registered but request never fired
  &nbsp;|&nbsp; <span style="color:#8250df">skipped</span> — test skipped (missing credentials for that role)
  &nbsp;|&nbsp; <span style="color:#6e7781">notTested</span> — route not covered by Cypress suite
  &nbsp;|&nbsp; <span style="color:#9a6700">temp-api</span> — not yet backed by fulfillment-service; using mock data
</div>

<script>
function applyFilters() {
  const cat = document.getElementById('filterCat').value;
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchBox').value.toLowerCase();
  const rows = document.querySelectorAll('#mainTable tbody tr');
  let visible = 0;
  rows.forEach(function(tr) {
    const matchCat = cat === 'all' || tr.dataset.category === cat;
    const matchStatus = status === 'all' || tr.dataset.status === status;
    const matchSearch = !search || tr.dataset.route.includes(search) || tr.textContent.toLowerCase().includes(search);
    const show = matchCat && matchStatus && matchSearch;
    tr.hidden = !show;
    if (show) visible++;
  });
  document.getElementById('rowCount').textContent = visible + ' of ${total} routes';
}
applyFilters();
</script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[gen-coverage-html] Loading data...')
  const { manifest, cypressReport } = await loadData()

  if (manifest.length === 0) {
    console.error('[gen-coverage-html] No manifest entries — aborting')
    process.exit(1)
  }

  const rows = mergeData(manifest, cypressReport)

  const ok = rows.filter((r) => r.runtimeStatus === 'ok').length
  const empty = rows.filter((r) => r.runtimeStatus === 'empty').length
  const failed = rows.filter((r) => r.runtimeStatus === 'failed').length
  const notTested = rows.filter((r) => r.runtimeStatus === 'notTested').length
  console.log(
    `[gen-coverage-html] ${rows.length} routes | ok:${ok} empty:${empty} failed:${failed} notTested:${notTested}`,
  )

  const html = renderHtml(rows, cypressReport)
  await writeFile(outFile, html, 'utf8')
  console.log(`[gen-coverage-html] Written → apps/e2e/cypress/api-coverage-report.html`)
}

main().catch((err) => {
  console.error('[gen-coverage-html] Error:', err)
  process.exit(1)
})

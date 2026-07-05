/**
 * gen-api-diff.mjs
 *
 * Codegen script that introspects source files to produce an API diff manifest:
 *   libs/ui-components/src/pages/dev/api-diff-manifest.generated.ts
 *
 * Sources read:
 *   - libs/ui-components/src/api/types.ts          (ApiRoute union + inline comments)
 *   - libs/ui-components/src/api/v1/*.ts            (hook files → ops + @temp-api)
 *   - libs/ui-components/src/api/v1/*.ts            (route references)
 *   - fulfillment-service/proto/public/osac/public/v1/*_service.proto
 *   - apps/app-frontend/src/demo/mock-store.ts      (mock data presence)
 *
 * Run: node scripts/gen-api-diff.mjs
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const typesFile = path.join(repoRoot, 'libs/ui-components/src/api/types.ts')
const hooksDir = path.join(repoRoot, 'libs/ui-components/src/api/v1')
const protoDir = path.join(
  repoRoot,
  '../../Projects/forks/fulfillment-service/proto/public/osac/public/v1',
)
const mockStoreFile = path.join(
  repoRoot,
  'apps/app-frontend/src/demo/mock-store.ts',
)
const outDir = path.join(repoRoot, 'libs/ui-components/src/pages/dev')
const outFile = path.join(outDir, 'api-diff-manifest.generated.ts')

// ---------------------------------------------------------------------------
// Step 1: Parse ApiRoute union from types.ts
// ---------------------------------------------------------------------------

/**
 * @typedef {{ route: string; lineComment: string }} RouteEntry
 */

async function parseApiRoutes() {
  const src = await readFile(typesFile, 'utf8')
  const lines = src.split('\n')

  /** @type {RouteEntry[]} */
  const routes = []
  let inRouteUnion = false

  for (const line of lines) {
    if (/export type ApiRoute\s*=/.test(line)) {
      inRouteUnion = true
    }
    if (!inRouteUnion) continue

    const routeMatch = line.match(/\|\s*'(v1\/[^']+)'/)
    if (routeMatch) {
      const route = routeMatch[1]
      const commentMatch = line.match(/\/\/\s*(.+)$/)
      const lineComment = commentMatch ? commentMatch[1].trim() : ''
      routes.push({ route, lineComment })
    }

    // Section comments above route lines (e.g. // Storage (@temp-api ...))
    // These are captured via the preceding comment line — we post-process below.
    if (/^[^|]*;/.test(line) && inRouteUnion) {
      inRouteUnion = false
    }
  }

  // Also capture block comments immediately above each route line
  // by re-scanning with context
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const routeMatch = lines[i].match(/\|\s*'(v1\/[^']+)'/)
    if (!routeMatch) continue
    const route = routeMatch[1]

    // Collect all comments in the window above this line (up to 5 lines)
    let blockComment = ''
    for (let j = Math.max(0, i - 5); j < i; j++) {
      const cm = lines[j].match(/^\s*\/\/\s*(.+)$/)
      if (cm) blockComment = cm[1].trim()
    }

    const inlineMatch = lines[i].match(/\/\/\s*(.+)$/)
    const comment = inlineMatch ? inlineMatch[1].trim() : blockComment

    result.push({ route, comment })
  }

  return result
}

// ---------------------------------------------------------------------------
// Step 2: Scan hook files
// ---------------------------------------------------------------------------

/**
 * @typedef {{ routeRefs: Set<string>; methods: Set<string>; isTempApi: boolean; filename: string }} HookInfo
 */

async function scanHookFiles() {
  const files = await readdir(hooksDir)
  const tsFiles = files.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
  )

  /** @type {Map<string, HookInfo>} filename -> info */
  const hookMap = new Map()
  /** @type {Map<string, string>} route -> filename */
  const routeToHook = new Map()

  for (const file of tsFiles) {
    const src = await readFile(path.join(hooksDir, file), 'utf8')

    const routeRefs = new Set()
    for (const m of src.matchAll(/'(v1\/[^']+)'/g)) {
      routeRefs.add(m[1])
    }

    const methods = new Set()
    if (/'POST'/.test(src)) methods.add('create')
    if (/'PATCH'/.test(src)) methods.add('patch')
    if (/'DELETE'/.test(src)) methods.add('delete')
    // GET (list/get) — if file references a route at all
    if (routeRefs.size > 0) {
      methods.add('list')
      // get is present if there's a pathParams usage alongside a query (single item)
      if (/pathParams/.test(src)) methods.add('get')
    }

    const isTempApi = /@temp-api/i.test(src) || /Private-only/i.test(src)

    hookMap.set(file, { routeRefs, methods, isTempApi, filename: file })

    for (const route of routeRefs) {
      if (route.startsWith('v1/') && !routeToHook.has(route)) {
        routeToHook.set(route, file)
      }
    }
  }

  return { hookMap, routeToHook }
}

// ---------------------------------------------------------------------------
// Step 3: Check proto service files
// ---------------------------------------------------------------------------

async function getProtoServices() {
  let files = []
  try {
    files = await readdir(protoDir)
  } catch {
    // fulfillment-service repo may not be present — gracefully degrade
    console.warn(
      `[gen-api-diff] Proto dir not found: ${protoDir} — skipping proto checks`,
    )
    return new Map()
  }

  /** @type {Map<string, string>} route -> protoFilename */
  const protoMap = new Map()
  for (const f of files.filter((f) => f.endsWith('_service.proto'))) {
    // e.g. compute_instances_service.proto -> v1/compute_instances
    const base = f.replace('_service.proto', '')
    protoMap.set(`v1/${base}`, f)
  }
  return protoMap
}

// ---------------------------------------------------------------------------
// Step 4: Check mock store
// ---------------------------------------------------------------------------

async function getMockRoutes() {
  const src = await readFile(mockStoreFile, 'utf8')
  const mockRoutes = new Set()
  for (const m of src.matchAll(/'(v1\/[^']+)'\s*:/g)) {
    mockRoutes.add(m[1])
  }
  return mockRoutes
}

// ---------------------------------------------------------------------------
// Step 5: Get inline section comment for a route from types.ts
// ---------------------------------------------------------------------------

async function getSectionComments() {
  const src = await readFile(typesFile, 'utf8')
  const lines = src.split('\n')
  /** @type {Map<string, string>} route -> sectionComment */
  const map = new Map()
  let lastComment = ''
  for (const line of lines) {
    const commentMatch = line.match(/^\s*\/\/\s*(.+)$/)
    if (commentMatch && !line.includes("'v1/")) {
      lastComment = commentMatch[1].trim()
    }
    const routeMatch = line.match(/\|\s*'(v1\/[^']+)'/)
    if (routeMatch) {
      map.set(routeMatch[1], lastComment)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Step 6: Determine category + ops + missingOps
// ---------------------------------------------------------------------------

const ALL_OPS = ['list', 'get', 'create', 'patch', 'delete']

function categorise(route, sectionComment, routeToHook, hookMap, protoMap) {
  const isTempApiComment =
    /@temp-api/i.test(sectionComment) || /private-only/i.test(sectionComment)
  const hookFile = routeToHook.get(route) ?? null
  const hookInfo = hookFile ? hookMap.get(hookFile) : null
  const isTempApiHook = hookInfo?.isTempApi ?? false
  const protoFile = protoMap.get(route) ?? null

  let category
  if (isTempApiComment || isTempApiHook || !protoFile) {
    category = 'temp-api'
  } else if (protoFile && hookFile) {
    category = 'real'
  } else {
    category = 'proto-no-hook'
  }

  const ops = hookInfo ? [...hookInfo.methods].sort() : []
  const missingOps = category === 'real' ? ALL_OPS.filter((op) => !ops.includes(op)) : []

  return { category, ops, missingOps, hookFile, protoFile }
}

// ---------------------------------------------------------------------------
// Step 7: Build notes
// ---------------------------------------------------------------------------

function buildNotes(route, sectionComment, category) {
  const notes = []
  if (/@temp-api/i.test(sectionComment)) {
    notes.push('@temp-api — not yet in fulfillment-service')
  }
  if (/private-only/i.test(sectionComment)) {
    notes.push('Private-only — no public proto')
  }
  if (category === 'proto-no-hook') {
    notes.push('Proto exists but no UI hook or page implemented yet')
  }
  return notes.join('; ') || null
}

// ---------------------------------------------------------------------------
// Step 8: Render TypeScript output
// ---------------------------------------------------------------------------

function renderTs(entries) {
  const entriesStr = entries
    .map((e) => {
      const fields = [
        `    route: '${e.route}'`,
        `    category: '${e.category}'`,
        `    ops: [${e.ops.map((o) => `'${o}'`).join(', ')}]`,
        `    missingOps: [${e.missingOps.map((o) => `'${o}'`).join(', ')}]`,
        `    protoFile: ${e.protoFile ? `'${e.protoFile}'` : 'null'}`,
        `    hookFile: ${e.hookFile ? `'${e.hookFile}'` : 'null'}`,
        `    hasMockData: ${e.hasMockData}`,
        `    notes: ${e.notes ? `'${e.notes}'` : 'null'}`,
      ]
      return `  {\n${fields.join(',\n')},\n  }`
    })
    .join(',\n')

  return `// AUTO-GENERATED — run \`pnpm gen:api-diff\` to regenerate. Do not edit manually.
// Generated: ${new Date().toISOString()}

export interface ApiDiffEntry {
  route: string;
  category: 'real' | 'temp-api' | 'proto-no-hook';
  ops: string[];
  missingOps: string[];
  protoFile: string | null;
  hookFile: string | null;
  hasMockData: boolean;
  notes: string | null;
}

export const API_DIFF_MANIFEST: ApiDiffEntry[] = [
${entriesStr},
];
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[gen-api-diff] Scanning source files...')

  const [routeEntries, { routeToHook, hookMap }, protoMap, mockRoutes, sectionComments] =
    await Promise.all([
      parseApiRoutes(),
      scanHookFiles(),
      getProtoServices(),
      getMockRoutes(),
      getSectionComments(),
    ])

  const entries = routeEntries.map(({ route }) => {
    const sectionComment = sectionComments.get(route) ?? ''
    const { category, ops, missingOps, hookFile, protoFile } = categorise(
      route,
      sectionComment,
      routeToHook,
      hookMap,
      protoMap,
    )
    const hasMockData = mockRoutes.has(route)
    const notes = buildNotes(route, sectionComment, category)

    return { route, category, ops, missingOps, protoFile, hookFile, hasMockData, notes }
  })

  const counts = {
    real: entries.filter((e) => e.category === 'real').length,
    'temp-api': entries.filter((e) => e.category === 'temp-api').length,
    'proto-no-hook': entries.filter((e) => e.category === 'proto-no-hook').length,
  }
  console.log(
    `[gen-api-diff] Found ${entries.length} routes: ${counts.real} real, ${counts['temp-api']} temp-api, ${counts['proto-no-hook']} proto-no-hook`,
  )

  await mkdir(outDir, { recursive: true })
  await writeFile(outFile, renderTs(entries), 'utf8')
  console.log(`[gen-api-diff] Written → ${path.relative(repoRoot, outFile)}`)
}

main().catch((err) => {
  console.error('[gen-api-diff] Error:', err)
  process.exit(1)
})

# osac-ux — End-to-End Tests

Cypress e2e suite for `osac-ux`. Three test groups are included:

| Group | Spec pattern | Purpose |
|---|---|---|
| Shell / auth | `cypress/e2e/*.cy.ts` | Existing smoke tests (stubbed IdP) |
| API Coverage | `cypress/e2e/api-coverage/**` | Real-backend tests that report data gaps |
| Functional flows | `cypress/e2e/flows/**` | Creation flows per persona — creates real resources and cleans up |

---

## Prerequisites

- Node ≥ 22, pnpm ≥ 9
- Access to the lab OpenShift cluster (VPN or `/etc/hosts` entry for `*.apps.test-infra-cluster-osacui.redhat.com`)
- The `osac-ux` dev server running against the real backend (see below)

---

## Quick start

### 1. Start the dev server

```bash
# From the repo root
FULFILLMENT_API_URL=https://fulfillment-api-osac-e2e-ci.apps.test-infra-cluster-osacui.redhat.com \
FULFILLMENT_TLS_INSECURE=1 \
OIDC_TLS_INSECURE=1 \
pnpm dev
```

The proxy starts on `http://localhost:5173`.

### 2. Install e2e dependencies

```bash
cd apps/e2e
pnpm install
```

### 3. Open Cypress (interactive)

```bash
pnpm cypress open
```

### 4. Run the full API coverage suite (headless)

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm cypress run \
  --spec 'cypress/e2e/api-coverage/**' \
  --env keycloak_user=admin,keycloak_pass=admin
```

The report is written to `cypress/api-coverage-report.json` when the suite finishes.

---

## API Coverage suite

### What it tests

For every page in the app the suite:
1. Logs in with a real Keycloak account (no stubs)
2. Intercepts every `GET /api/fulfillment/v1/*` call the page makes
3. Checks that the API returned `items.length > 0`
4. Checks that key UI fields render non-empty content
5. Collects all results into a JSON report

### Authentication

`cy.realLogin()` uses Keycloak's **Resource Owner Password Credentials** grant to get tokens directly (no browser redirect), then injects them as the three session cookies the Go BFF proxy reads:

| Cookie | Content |
|---|---|
| `osac-access` | Access token |
| `osac-refresh` | Refresh token |
| `osac-id` | ID token |

Credentials are passed via `--env` flags (never hardcoded):

```bash
--env keycloak_user=<user>,keycloak_pass=<password>
```

For tests that require **provider admin** access, pass additional env vars:

```bash
--env keycloak_user=admin,keycloak_pass=<pw>,\
      keycloak_provider_user=provider-admin,keycloak_provider_pass=<pw>
```

If `keycloak_provider_user` / `keycloak_provider_pass` are not supplied (or left blank in `cypress.env.json`), those provider-only tests are **skipped** automatically — they cannot pass without a `providerAdmin` role.

### Report format

`cypress/api-coverage-report.json`:

```json
{
  "generatedAt": "2026-07-06T19:00:00.000Z",
  "apiResults": [
    { "domain": "networking", "route": "v1/network_classes", "op": "list",
      "status": "empty", "itemCount": 0, "httpStatus": 200 },
    { "domain": "compute", "route": "v1/compute_instances", "op": "list",
      "status": "ok", "itemCount": 4, "httpStatus": 200 }
  ],
  "fieldGaps": [
    { "domain": "networking", "page": "VirtualNetworkNewPage",
      "field": "Network class select options", "status": "empty" }
  ],
  "summary": {
    "byDomain": {
      "networking": { "ok": 2, "empty": 1, "failed": 0, "notCalled": 1 }
    },
    "totalApis": 38,
    "ok": 30, "empty": 4, "failed": 2, "notCalled": 2,
    "fieldGapsCount": 3
  }
}
```

Possible `status` values for API results:

| Status | Meaning |
|---|---|
| `ok` | API responded 2xx and returned at least one item |
| `empty` | API responded 2xx but returned zero items (data missing in backend) |
| `failed` | API responded with a 4xx or 5xx error |
| `notCalled` | The page never triggered the expected request |

### Domain coverage

| Domain | API routes covered | Role |
|---|---|---|
| `compute` | compute_instances, instance_types, compute_instance_catalog_items, compute_instance_templates | tenantUser |
| `baremetal` | baremetal_instances, host_types, baremetal_instance_catalog_items, baremetal_instance_templates | tenantUser |
| `clusters` | clusters, cluster_catalog_items, cluster_templates | tenantUser |
| `networking` | virtual_networks, network_classes, subnets, security_groups | tenantUser |
| `ip-management` | public_ips, public_ip_pools, external_ip_pools, public_ip_attachments, external_ips | tenantUser / providerAdmin |
| `storage` | block_volumes, volume_snapshots, object_storage_buckets, storage_tiers, storage_backends | tenantUser / providerAdmin |
| `load-balancers` | load_balancers | tenantUser |
| `iam` | users, role_bindings, identity_providers, roles | tenantAdmin |
| `projects` | projects, project_memberships | tenantUser |
| `models` | maas_instances, maas_catalog_items, ai_environments | tenantUser / providerAdmin |
| `platform` | capabilities, tenants, organizations | providerAdmin |

---

## Coverage Map Report

The Coverage Map Report is an HTML file that gives an integration manager a single view of every API route in the application: which UI pages call it, whether the backend is real or still a mock, and whether the last Cypress run got real data back from it.

### How it works

The report is built from two layers combined by a script:

| Layer | Source | What it provides |
|---|---|---|
| Static manifest | Source code (hook files + page files + `AppShell.tsx`) | Route → category (real/temp-api), ops, UI pages |
| Runtime results | Cypress `api-coverage-report.json` | Runtime status (ok/empty/failed), item count, HTTP status |

### How to generate

```bash
# Step 1 — from apps/e2e/ — run the full api-coverage suite
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm cypress run \
  --spec 'cypress/e2e/api-coverage/**'

# Step 2 — from the repo root — merge static manifest + runtime results
pnpm gen:coverage-report

# Open the report in a browser
open apps/e2e/cypress/api-coverage-report.html
```

You can also run `pnpm gen:coverage-report` without a Cypress run first — all runtime columns will show `notTested`, which is still useful for reviewing the static page→API map before running tests.

### Report columns

| Column | Description |
|---|---|
| Route | The fulfillment API route, e.g. `v1/compute_instances` |
| Category | `real` = backed by a proto-aligned fulfillment endpoint; `temp-api` = not yet in fulfillment-service (uses mock data in demo mode) |
| Ops | CRUD operations the UI hook implements (list / get / create / patch / delete) |
| UI Pages | Every app route that calls this API, e.g. `/vms`, `/vms/:id` |
| Runtime | Result from the last Cypress run (see legend below) |
| Items | Number of items in the API response on the last run |
| HTTP | HTTP status code returned by the API |
| Hook file | Source file in `libs/ui-components/src/api/v1/` |

### Runtime status legend

| Status | Meaning |
|---|---|
| `ok` | API returned at least one item |
| `empty` | API responded 2xx but returned zero items — backend exists but has no data |
| `failed` | API returned a 4xx or 5xx error |
| `notCalled` | `cy.trackApi` was registered but the page never triggered the request |
| `skipped` | Test was skipped — usually because `keycloak_provider_user` is not configured |
| `notTested` | Route is in the manifest but has no corresponding Cypress spec |

### What to look for

- **`temp-api` + `notTested`** — feature is UI-only (mock data); no backend yet. Acceptable until the corresponding fulfillment-service endpoint ships.
- **`real` + `empty`** — the API exists but returned no data; check whether the backend has seed data for the test environment.
- **`real` + `failed`** — the API exists but is broken or the Cypress user lacks permission.
- **`ok` + many pages** — a shared API used across many views; a backend regression here has wide UI impact.

### Generated files (not committed)

```
apps/e2e/
├── api-diff-manifest.generated.json      # Static manifest (generated by gen:api-diff)
└── cypress/
    ├── api-coverage-report.json           # Runtime results (generated by Cypress)
    └── api-coverage-report.html           # Manager report (generated by gen:coverage-report)
```

---

## Existing smoke tests

The two existing specs (`sign-in-entry.cy.ts`, `application-shell-session.cy.ts`) use a **stubbed IdP** and do not require a running backend. Run them independently:

```bash
pnpm cypress run --spec 'cypress/e2e/*.cy.ts'
```

---

## File layout

```
apps/e2e/
├── cypress.config.ts                        # Cypress config + Node-side report tasks
├── cypress.env.json                         # Keycloak credentials (gitignored)
├── api-diff-manifest.generated.json         # Static manifest (gitignored, run gen:api-diff)
├── cypress/
│   ├── support/
│   │   ├── e2e.ts                           # Support entry — imports all commands
│   │   ├── real-login.ts                    # cy.realLogin (Keycloak password grant)
│   │   └── api-report.ts                   # cy.trackApi + cy.checkField
│   └── e2e/
│       ├── sign-in-entry.cy.ts              # Smoke: unauthenticated redirect
│       ├── application-shell-session.cy.ts  # Smoke: shell with stub session
│       └── api-coverage/
│           ├── compute.cy.ts
│           ├── baremetal.cy.ts
│           ├── clusters.cy.ts
│           ├── networking.cy.ts
│           ├── ip-management.cy.ts
│           ├── storage.cy.ts
│           ├── load-balancers.cy.ts
│           ├── iam.cy.ts
│           ├── projects.cy.ts
│           ├── models.cy.ts
│           ├── platform.cy.ts
│           ├── _report.cy.ts                # Runs last — writes api-coverage-report.json
│           ├── api-coverage-report.json     # Runtime results (gitignored)
│           └── api-coverage-report.html     # Manager report (gitignored)
│   └── flows/
│       └── tenant-user/
│           ├── networking.cy.ts             # VNet + Subnet creation
│           ├── storage.cy.ts               # Block Volume creation
│           ├── vm.cy.ts                    # VM 5-step wizard
│           ├── cluster.cy.ts              # Cluster 5-step wizard
│           └── baremetal.cy.ts            # Bare Metal 4-step wizard
└── README.md                                # This file
```

Scripts (at repo root, run with `pnpm`):

| Script | What it does |
|---|---|
| `gen:api-diff` | Regenerates the static manifest (also runs on `pnpm install`) |
| `gen:coverage-report` | Runs `gen:api-diff` then builds the HTML report |

---

## Functional creation tests

Located in `cypress/e2e/flows/` and organised by **persona → resource category**.

### What each spec covers

| Spec | Resources created | Cleanup |
|---|---|---|
| `tenant-user/networking.cy.ts` | Virtual Network, Subnet | `DELETE v1/virtual_networks`, `DELETE v1/subnets` |
| `tenant-user/storage.cy.ts` | Block Volume | `DELETE v1/block_volumes` |
| `tenant-user/vm.cy.ts` | VM (+ test VNet/Subnet) | `DELETE v1/compute_instances`, `DELETE v1/subnets`, `DELETE v1/virtual_networks` |
| `tenant-user/cluster.cy.ts` | Cluster | `DELETE v1/clusters` |
| `tenant-user/baremetal.cy.ts` | Bare Metal instance | `DELETE v1/baremetal_instances` |

All specs use real Keycloak authentication via `cy.realLogin()` (credentials from `cypress.env.json`).

### Prerequisites

- The dev server must be running and connected to a real backend.
- **Simple form specs** (`networking`, `storage`): require at least one network class in `v1/network_classes`. Tests self-skip if none are found.
- **Wizard specs** (`vm`, `cluster`, `baremetal`): require at least one catalog item in the corresponding `v1/*_catalog_items` endpoint. Tests self-skip if none are found.
- The tenant user (`keycloak_user`) must have permission to create resources in the backend.

### Running the flows

```bash
# All personas, all categories
pnpm cypress run --spec 'cypress/e2e/flows/**'

# Single persona
pnpm cypress run --spec 'cypress/e2e/flows/tenant-user/**'

# Single category
pnpm cypress run --spec 'cypress/e2e/flows/tenant-user/networking.cy.ts'

# Interactive (Cypress UI — recommended for debugging)
pnpm cypress open
# Then navigate to flows/tenant-user/ in the spec browser
```

### Fast-fail and timeout settings

For CI or full-suite runs, reduce wasted time on missing dependencies:

```bash
pnpm cypress run --spec 'cypress/e2e/flows/**' --config responseTimeout=10000
```

Add `bail: 1` to `cypress.config.ts` to stop the entire run after the first failing spec.

### Adding more personas

1. Create a new folder: `cypress/e2e/flows/tenant-admin/` (or `provider-user/` etc.)
2. Add the persona's credentials to `cypress.env.json` (e.g. `keycloak_admin_user` / `keycloak_admin_pass`)
3. Copy the pattern from `tenant-user/` — change `USER()`/`PASS()` to the new env vars and the `PERSONA` constant.

### Cleanup strategy

All resources are deleted via `cy.deleteResource(route, id)` in `afterEach` (simple forms) or `after` (wizards that share setup state). Cleanup calls use `failOnStatusCode: false` so a 404 (already deleted) does not fail the cleanup step.

For the VM spec, the cleanup order is: VM → Subnet → VNet (child resources before parents).

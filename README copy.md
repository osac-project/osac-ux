# OSAC UI

OSAC UI is the web console for the [Open Sovereign AI Cloud (OSAC)](https://github.com/osac-project/) project — a self-service platform for deploying OpenShift clusters, virtual machines, and bare metal hosts. It is a pnpm monorepo consisting of a React 19 + PatternFly 6 single-page application and a Go chi reverse proxy that handles OIDC authentication and forwards requests to the upstream [fulfillment-service](https://github.com/osac-project/fulfillment-service).

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/app-frontend/` | React SPA (Vite, React 19, TanStack Query, react-router-dom 7) |
| `apps/e2e/` | Cypress end-to-end tests |
| `libs/api-contracts/` | Shared TypeScript types and wire normalizers |
| `libs/types/` | Generated protobuf types (do not edit) |
| `libs/ui-components/` | Shared PatternFly 6 component library |
| `proxy/` | Go chi reverse proxy — OIDC auth + API forwarding |
| `deploy/chart/` | Helm chart for Kubernetes/OpenShift deployment |
| `docs/` | Architecture and deployment documentation |

## Quick start

Prerequisites: Node.js 20+, pnpm 9+, Go 1.23+

```bash
pnpm install
```

Start the Go proxy (requires a running fulfillment API) and Vite dev server:

```bash
FULFILLMENT_API_URL=https://fulfillment.your-env.example.com pnpm dev
```

## Developer tools

The repo includes a codegen script that introspects source files and produces a live API coverage report visible in the app under **Development > API Diff** (`/dev/api-diff`):

```bash
pnpm gen:api-diff
```

This runs automatically on `pnpm install` via the `postinstall` hook and writes `libs/ui-components/src/pages/dev/api-diff-manifest.generated.ts`. The page shows all 37 `ApiRoute` entries classified as **real** (proto-aligned hook), **temp-api** (no proto yet), or **proto-no-hook** (proto exists but no UI hook).

## Documentation

| Document | Description |
|----------|-------------|
| [OpenShift deployment guide](docs/deployment-openshift-guide.md) | Step-by-step guide for deploying on OpenShift with Keycloak and fulfillment-service |
| [API query architecture](docs/api-query-arch.md) | How the API layer is split between `ui-components` and the app |
| [AGENTS.md](AGENTS.md) | Dev environment setup, scripts reference, and coding conventions |

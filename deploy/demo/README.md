# osac-ux Demo Deployment

Deploys osac-ux in fully mocked demo mode (`VITE_DEMO_MODE=true`) as a public HTTPS page on the
OpenShift cluster. All data comes from the in-memory mock store — no backend, no OIDC required.

> **Note on BuildConfig:** The cluster's OpenShift builder pods cannot pull their builder image from
> quay.io (expired cluster pull secret). Images must be built **locally** and pushed to the
> cluster's internal registry.

## How it works

```
Local machine                    OpenShift cluster
─────────────────────────────    ──────────────────────────────────────────────────
docker build -f Dockerfile.demo
        │
        │  docker push
        ▼
Internal registry ──────────────► ImageStream (osac-ux-demo:latest)
                                          │  image pull (auto-triggered)
                                          ▼
                                     Deployment (nginx, port 8080)
                                          │
                                       Service
                                          │
                                       Route (TLS edge)
                                          │
                                          ▼
  https://osac-ux-demo-osac-ux-demo.apps.test-infra-cluster-osacui.redhat.com/osac-ux/
```

## Prerequisites

- [`oc` CLI](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html) installed
- Docker (or Podman) installed locally
- Logged in to the cluster as `admin`

## Deploy

### 1. Log in to the cluster

```bash
oc login https://api.test-infra-cluster-osacui.redhat.com:6443 \
  -u admin -p '<password>'
```

### 2. Create the namespace (skip if it already exists)

```bash
oc new-project osac-ux-demo
```

### 3. Apply all resources

```bash
oc apply -f deploy/demo/openshift.yaml
```

This creates: ImageStream, Deployment, Service, and Route.

### 4. Get the internal registry hostname

```bash
REGISTRY=$(oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}')
echo $REGISTRY
# e.g. default-route-openshift-image-registry.apps.test-infra-cluster-osacui.redhat.com
```

### 5. Log in to the internal registry

```bash
docker login -u admin -p $(oc whoami -t) $REGISTRY
```

### 6. Build the image locally

From the osac-ux repo root:

```bash
docker build -f Dockerfile.demo -t $REGISTRY/osac-ux-demo/osac-ux-demo:latest .
```

This takes **3–6 minutes** on first run (pnpm install + Vite build). Subsequent builds are faster
due to Docker layer caching.

### 7. Push to the internal registry

```bash
docker push $REGISTRY/osac-ux-demo/osac-ux-demo:latest
```

The Deployment auto-rolls out when the new image lands in the ImageStream.

### 8. Verify the rollout

```bash
oc rollout status deployment/osac-ux-demo -n osac-ux-demo
```

Expected: `deployment "osac-ux-demo" successfully rolled out`

### 9. Open in browser

```
https://osac-ux-demo-osac-ux-demo.apps.test-infra-cluster-osacui.redhat.com/osac-ux/
```

Navigating to `/` automatically redirects to `/osac-ux/`.

## Re-deploying after a code change

```bash
docker build -f Dockerfile.demo -t $REGISTRY/osac-ux-demo/osac-ux-demo:latest .
docker push $REGISTRY/osac-ux-demo/osac-ux-demo:latest
```

The Deployment picks up the new image automatically.

## Full one-shot script

```bash
# Set these once
REGISTRY=$(oc get route default-route -n openshift-image-registry -o jsonpath='{.spec.host}')
docker login -u admin -p $(oc whoami -t) $REGISTRY

# Build and push
docker build -f Dockerfile.demo -t $REGISTRY/osac-ux-demo/osac-ux-demo:latest .
docker push $REGISTRY/osac-ux-demo/osac-ux-demo:latest

# Watch rollout
oc rollout status deployment/osac-ux-demo -n osac-ux-demo

# Print URL
echo "https://$(oc get route osac-ux-demo -n osac-ux-demo -o jsonpath='{.spec.host}')/osac-ux/"
```

## Troubleshooting

| Symptom | Command |
|---|---|
| Deployment not rolling out | `oc get pods -n osac-ux-demo` |
| Pod not starting | `oc describe pod <name> -n osac-ux-demo` |
| Pod logs | `oc logs deployment/osac-ux-demo -n osac-ux-demo` |
| Route info | `oc describe route osac-ux-demo -n osac-ux-demo` |
| Registry not reachable | `oc get route default-route -n openshift-image-registry` |

## Environment variables reference (from osac-ui)

In demo mode none of these are needed. Listed for completeness from `osac-ui/proxy/config/config.go`:

| Variable | osac-ui default | Used in demo? |
|---|---|---|
| `FULFILLMENT_API_URL` | `https://fulfillment-api:8000` | No (mock store) |
| `OIDC_CLIENT_ID` | `osac-ui` | No (no OIDC) |
| `FULFILLMENT_TLS_CA_FILE` | — | No |
| `OIDC_TLS_CA_FILE` | — | No |
| `VITE_DEMO_MODE` | — | Yes — baked in at build time |

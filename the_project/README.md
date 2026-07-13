# The Project

## Exercise releases

- [3.7](https://github.com/MarineAnimal/KubernetesSubmissions/releases/tag/3.7) — the_project
- [3.8](https://github.com/MarineAnimal/KubernetesSubmissions/releases/tag/3.8) — the_project
- [3.9](https://github.com/MarineAnimal/KubernetesSubmissions/releases/tag/3.9) — the_project
- [3.10](https://github.com/MarineAnimal/KubernetesSubmissions/releases/tag/3.10) — the_project

## 4.1 Readiness probe

Builds on 3.4 (Gateway API route rewrite). Ping-pong now persists its
counter in Postgres instead of keeping it in memory, which gives both
apps something real to be "not ready" about.

These files live alongside the todo app in this same folder, but are a
**separate deployment in a separate namespace** (`exercises`, not
`project`) — see the naming/collision notes below before touching
`kustomization.yaml`.

### What changed from 3.4

- **pingpong** connects to a new `pingpong-postgres` StatefulSet (kept
  separate from this project's own `todo-postgres` — different app,
  different DB, different namespace). It retries the DB connection in
  the background instead of blocking startup, so the container comes up
  immediately but reports not-ready via `/readyz` until the DB
  connection and table are confirmed.
- **pingpong** also gained a `/pongs` endpoint: a read-only counter read
  used only by log-output (previously referenced by log-output's code
  but never implemented by pingpong, so it silently 404'd).
- **log-output** polls `pingpong-svc/pongs` in the background and reports
  ready via `/readyz` only once that poll has succeeded at least once.

### Readiness probes

- `pingpong-dep`: `GET /readyz` on port 3000 → 200 once connected to
  Postgres, 503 otherwise.
- `logoutput-dep`: `GET /readyz` on port 3000 → 200 once it has reached
  `pingpong-svc`, 503 otherwise.

### File naming note

This folder's `k8s/` also holds the todo app's own manifests
(`namespace.yaml` → `project`, `db-secret.yaml` → `todo-db-secret`,
`postgres.yaml` → `todo-postgres`, all wired into `kustomization.yaml`).
Since ping-pong/log-output run in a different namespace (`exercises`),
their equivalents are named to avoid collisions and are **not** included
in `kustomization.yaml`:

- `exercises-namespace.yaml` (namespace `exercises`)
- `pingpong-db-secret.yaml` (secret `pingpong-db-secret`)
- `pingpong-postgres.yaml` (StatefulSet `pingpong-postgres`)

Apply these with plain `kubectl apply -f`, not `kubectl apply -k` — mixing
them into the Kustomize setup would force them into the `project`
namespace via the top-level `namespace: project` field, which doesn't
match how they're actually deployed.

### Testing

Run these against the `4.1` tag, where all the manifests are in this folder's
`k8s/`. On `main` the log-output and todo-app manifests moved to the
[config repo](https://github.com/MarineAnimal/KubernetesSubmissions-config)
during the GitOps exercises (4.7 onward).

Apply everything except `pingpong-postgres.yaml`:

```
kubectl apply -f k8s/exercises-namespace.yaml
kubectl apply -f k8s/pingpong-db-secret.yaml
kubectl apply -f k8s/configmap-log-output.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/deployment-log-output.yaml
kubectl apply -f k8s/service-pingpong.yaml
kubectl apply -f k8s/service-log-output.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/httproute.yaml
```

`kubectl get po -n exercises` should show both pods `Running` but not
ready (`0/1`). Then apply the database:

```
kubectl apply -f k8s/pingpong-postgres.yaml
```

Within a few readiness-probe cycles, `pingpong-dep` flips to `1/1`, and
once log-output's next poll picks that up, `logoutput-dep` flips to
`1/1` as well.


## Database, DBaaS vs self-hosted

A written comparison of running this project's database as a managed service (Google
Cloud SQL) versus self-hosting it in the cluster lives in
[database-comparison.md](database-comparison.md).

# Exercise 5.7 — Deploy to serverless (Ping-pong as a Knative Service)

Makes the **ping-pong** service of the Log Output app **serverless**: ping-pong is
deployed as a **Knative Service** (ksvc) in the `exercises` namespace, and the
log-output app calls it and displays the pong count.

Runs on the **k3d + Knative** cluster set up in [5.6](../5.6/README.md).

## Components

- **ping-pong** (`pingpong/`) — the simple in-memory counter app (same as
  `3.1-pingpong-gke`): `GET /pingpong` → `pong N`. Deployed as a **Knative
  Service** (`manifests/pingpong-ksvc.yaml`).
- **log-output** (`log-output/`) — a normal Deployment. Polls ping-pong every 3s
  and shows the pong at `/` and in its log.

## Key details

### Call ping-pong by its fully qualified DNS name
log-output calls **`http://pingpong.exercises.svc.cluster.local/pingpong`**, not
`http://pingpong`. The short name hits Knative's host-based routing and fails; the
FQDN resolves to the cluster-local Service Knative creates for the ksvc. (Per the
exercise tip.)

### min-scale = 1
The ping-pong counter lives in memory. If the ksvc scaled to zero, every cold
start would reset the counter (and briefly return empty 503s to the poller). The
annotation `autoscaling.knative.dev/min-scale: "1"` keeps one instance warm, so
the counter is stable — while ping-pong is still a Knative-managed service that
scales **up** under load.

### Fresh connection per request (robustness)
log-output uses `http.get(..., { agent: false })` (a new connection per request)
instead of keep-alive/`fetch`. Kourier reconfigures routing as Knative revisions
come and go, and a pinned keep-alive socket can get stuck on stale routing and
return empty bodies. A fresh connection each poll makes it resilient to that and
to start-order races (log-output starting before ping-pong is Ready).

### Local images on k3d
k3d does not share the host Docker image store, so images are imported into the
cluster (they are tagged `dev.local/*`, which is in Knative's
`registries-skipping-tag-resolving` list, so Knative does not try to resolve the
tag to a digest against a registry):

```bash
docker build -t dev.local/pingpong-57:1 ./pingpong
docker build -t dev.local/log-output-57:1 ./log-output
k3d image import dev.local/pingpong-57:1 dev.local/log-output-57:1 -c k3s-default
```

## Deploy

```bash
kubectl apply -f manifests/namespace.yaml
kubectl apply -f manifests/pingpong-ksvc.yaml
kubectl apply -f manifests/log-output.yaml
```

## Verify

```bash
kubectl get ksvc pingpong -n exercises          # READY=True (serverless)
POD=$(kubectl get pod -n exercises -l app=log-output -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n exercises $POD -- wget -qO- http://localhost:3000/
# -> Ping / Pongs: pong 7
kubectl logs -n exercises $POD --tail=5
# -> ... | pong 5
#    ... | pong 6
#    ... | pong 7   (count climbing => log-output is reaching the serverless ping-pong)
```

## Cleanup

```bash
kubectl delete -f manifests/log-output.yaml -f manifests/pingpong-ksvc.yaml
# namespace/exercises can stay, or: kubectl delete -f manifests/namespace.yaml
```

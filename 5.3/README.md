# Exercise 5.3 — Log app, the Service Mesh Edition

Deploys the **log-output** app and a new **greeter** service into the Istio
**ambient** mesh (default namespace), then splits traffic **75% v1 / 25% v2**
between two greeter versions using a Gateway-API **HTTPRoute**, visualised in Kiali.

## Components

- **greeter** (`greeter/`) — tiny zero-dependency HTTP server. One image
  (`greeter:1`) serves both versions; `GREETING`/`VERSION` env vars differ per
  Deployment. `greeter-v1` says "Hello", `greeter-v2` says "Hola".
- **log-output** (`log-output/`) — calls `http://greeter-svc/` every second and
  shows the greeting in its stdout log and at `/`.
- **Services** — `greeter-svc` (stable name the log app calls, HTTPRoute parent),
  `greeter-svc-1` (v1 only), `greeter-svc-2` (v2 only).
- **HTTPRoute** (`manifests/httproute.yaml`) — attached to `greeter-svc`,
  splits to `greeter-svc-1` weight 75 / `greeter-svc-2` weight 25.

## Deploy

```bash
# Build images into the local docker-desktop store
docker build -t greeter:1 ./greeter
docker build -t log-output-53:1 ./log-output

# Enroll default in ambient + add an L7 waypoint (needed to split & see it in Kiali)
kubectl label namespace default istio.io/dataplane-mode=ambient --overwrite
istioctl waypoint apply -n default --enroll-namespace

kubectl apply -f manifests/greeter.yaml
kubectl apply -f manifests/httproute.yaml
kubectl apply -f manifests/log-output.yaml
```

## Verify the split

```bash
# 40 requests through the mesh — expect ~30 v1 / ~10 v2
kubectl run splittest -n default --rm -i --restart=Never \
  --image=curlimages/curl:8.11.0 --command -- \
  sh -c 'for i in $(seq 40); do curl -s http://greeter-svc/; echo; done' | sort | uniq -c
```

Result: `30 Hello from greeter v1` / `10 Hola from greeter v2` — exactly 75/25.

The `screenshots/` Kiali Traffic Graph shows `greeter-svc` fanning out to
`greeter-v1` (~75%) and `greeter-v2` (~25%).

## Cleanup (keep the Istio + Prometheus + Kiali baseline)

```bash
kubectl delete -f manifests/log-output.yaml -f manifests/httproute.yaml -f manifests/greeter.yaml
kubectl delete pod traffic-gen -n default --ignore-not-found
istioctl waypoint delete -n default waypoint
kubectl label namespace default istio.io/dataplane-mode- istio.io/use-waypoint-
```

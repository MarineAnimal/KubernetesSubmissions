# 4.3 Prometheus

Installed via Helm into the `monitoring` namespace:

- `prometheus-community/prometheus` (release `prom`)
- `grafana/grafana` (release `grafana`)

## Setup

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install prom prometheus-community/prometheus --namespace monitoring
helm install grafana grafana/grafana --namespace monitoring
```

## Accessing the Prometheus UI

Port-forwarded through the Service (not the pod directly, so it survives
pod restarts):

```powershell
kubectl port-forward svc/prom-prometheus-server -n monitoring 9090:80
```

Then open `http://localhost:9090`.

## Query: pods created by StatefulSets in the monitoring namespace

```
count(kube_pod_info{namespace="monitoring", created_by_kind="StatefulSet"})
```

**Result: `1`.**

Only `prom-alertmanager-0` runs as a StatefulSet in this chart's default
configuration, `prometheus-server` runs as a Deployment unless
`server.statefulSet.enabled=true` is explicitly set.

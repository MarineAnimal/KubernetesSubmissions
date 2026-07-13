# 5.2 Getting started with Istio service mesh

Followed the Istio ambient getting-started guide: installed the Istio CLI, set up
Istio in ambient mode on the k3d cluster, deployed the sample app, and viewed the
mesh in Kiali.

Kiali needs Prometheus, so the one non-default piece is `manifests/kiali.yaml`,
where the Prometheus URL points at the server in the monitoring namespace:

```yaml
prometheus:
  enabled: true
  url: http://prom-prometheus-server.monitoring:80
```

`screenshots/5.2_kialiworks.png` shows Kiali up and reading metrics from Prometheus.

# 1.7 Log output, HTTP endpoint behind an Ingress

The "Log output" app now serves over HTTP instead of only logging to stdout.
`GET /` returns a small HTML page with the current timestamp and the random
string it generated on startup. It's exposed through a Service + Ingress
(IngressClass `nginx`) at `/`.

## Build & deploy

```bash
docker build -t log-output:1.7 .
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress-address>/            # HTML with a timestamp + random string
```

Locally (docker-desktop + ingress-nginx) you can port-forward the controller
and curl `http://localhost:8080/`.

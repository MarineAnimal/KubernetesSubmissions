# 1.8 The project — Ingress

The todo-app is switched from a NodePort Service to a ClusterIP Service exposed
through an **Ingress** (IngressClass `nginx`) at `/`. Same app as before; this
exercise is about routing traffic in via the ingress controller.

## Build & deploy

```bash
docker build -t todo-app:1.2 .
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress-address>/            # the todo-app page
```

Locally (docker-desktop + ingress-nginx): port-forward the controller and curl
`http://localhost:8080/`.

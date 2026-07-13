# 1.8 The project, Ingress

The todo-app is switched from a NodePort Service to a ClusterIP Service exposed
through an **Ingress** (IngressClass `nginx`) at `/`. Same app as before; this
exercise is about routing traffic in via the ingress controller.

## Deploy

Reuses the `todo-app:1.2` image from exercise 1.2 (there is no Dockerfile here,
so build it in 1.2 first). Then:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress-address>/            # "My todo app is running. cool! ..."
```

Locally (docker-desktop + ingress-nginx): port-forward the controller and curl
`http://localhost:8080/`.

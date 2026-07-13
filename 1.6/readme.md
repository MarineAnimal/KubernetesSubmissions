# 1.6 The project — expose with a NodePort Service

Same env-var todo-app as 1.5, now reachable from outside the cluster through a
**NodePort** Service. The Service maps the node port `30080` → in-cluster port
`1234` → the container's port `3000`.

## Build & deploy

```bash
docker build -t todo-app:1.6 .
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Test

```bash
kubectl get svc todo-app-svc              # NodePort, 1234:30080/TCP
curl localhost:30080                       # HTML greeting page ("My todo app is running. cool!")
```

On docker-desktop the node port is reachable on `localhost:30080`.

# 1.2 The project — declarative deployment

First version of the todo-app: a tiny Node HTTP server that just answers with a
"still alive" message on every request. Deployed to Kubernetes the declarative
way, with a Deployment manifest (no Service yet — that comes in a later
exercise, so for now you reach it via `kubectl port-forward`).

## Build & deploy

```bash
docker build -t todo-app:1.2 .
kubectl apply -f k8s/deployment.yaml
```

The image uses `imagePullPolicy: Never`, so build it locally first (and load it
into the cluster node if you're on kind / docker-desktop).

## Test

```bash
kubectl get pods                          # todo-app Running
kubectl port-forward deploy/todo-app 3000:3000
curl localhost:3000                       # the "app is running" message
```

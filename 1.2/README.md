# 1.2 declarative deployment

First version of the todo-app: a Node HTTP server that answers with a
"still alive" message on every request. Deployed to Kubernetes the declarative
way, with a Deployment manifest (no Service yet, that comes in a later
exercise, so for now you reach it via `kubectl port-forward`).

## Build & deploy

```bash
docker build -t todo-app:1.2 .
kind load docker-image todo-app:1.2 --name desktop
kubectl apply -f k8s/deployment.yaml
```

The image uses `imagePullPolicy: Never`, so build it locally first (and load it
into the cluster node if you're on kind / docker-desktop). this can be done:
```bash
  docker save todo-app:1.2 -o todo-app-1.2.tar
  docker cp todo-app-1.2.tar desktop-control-plane:/todo-app-1.2.tar
  docker exec desktop-control-plane ctr -n k8s.io images import /todo-app-1.2.tar
```

## Test
```bash
kubectl get pods                          # todo-app Running
kubectl logs deploy/todo-app                  # "Server started in port 3000"
kubectl exec deploy/todo-app -- printenv PORT # 3000
kubectl port-forward deploy/todo-app 3000:3000
curl localhost:3000                       # the "app is running" message
```



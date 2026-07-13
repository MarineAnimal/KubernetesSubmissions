# 1.4 The project — deployment iteration

Another pass at the todo-app Deployment. The app is still a minimal Node HTTP
server that responds "Todo app running" to any request; the point here is the
declarative Deployment manifest and getting it running from a plain
`kubectl apply`.

## Build & deploy

```bash
docker build -t todo-app:1.2 .
kubectl apply -f k8s/deployment.yaml
```

## Test

```bash
kubectl get pods                          # todo-app Running
kubectl port-forward deploy/todo-app 3000:3000
curl localhost:3000                       # "Todo app running"
```

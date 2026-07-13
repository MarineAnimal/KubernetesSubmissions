# 1.5 The project — configuration via environment variables

The todo-app now reads two values from the environment (`DEMO_GREETING` and
`DEMO_FAREWELL`) and renders them in a small HTML page, instead of having the
text hard-coded. The values are set in the Deployment manifest, so you can
change what the page says without rebuilding the image.

## Build & deploy

```bash
docker build -t todo-app:1.2 .
kubectl apply -f k8s/deployment.yaml
```

## Test

```bash
kubectl get pods                          # todo-app Running
kubectl port-forward deploy/todo-app 3000:3000
curl localhost:3000                       # HTML with the greeting + farewell
```

Edit the `env:` values in `k8s/deployment.yaml` and re-apply to see the page
text change with no rebuild.

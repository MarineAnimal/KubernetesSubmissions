# 1.3 Log output, declarative deploy & first release

The "Log output" application: on startup it picks a random UUID, then prints
that UUID plus the current timestamp to stdout every 5 seconds. There's no HTTP
endpoint yet. you read the output straight from the pod logs.
## Build & deploy
The image uses `imagePullPolicy: Never`, so it must be loaded into the cluster node, not just built locally. commands for that:
```bash
docker save todo-app:1.2 -o todo-app-1.2.tar
docker cp todo-app-1.2.tar desktop-control-plane:/todo-app-1.2.tar
docker exec desktop-control-plane ctr -n k8s.io images import /todo-app-1.2.tar
```

```bash
cd log_output
docker build -t log-output .
kubectl apply -f manifests/deployment.yaml
```

## Test

```bash
kubectl logs -l app=log-output -f         # a line every 5s: <timestamp>: <uuid>
```

Note: `package.json` lists the `uuid` dependency, but the code actually uses
Node's built-in `crypto.randomUUID()`, so nothing extra gets installed. the
Dockerfile only copies `index.js`.

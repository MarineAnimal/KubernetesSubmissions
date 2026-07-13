# 1.3 Log output, declarative deploy & first release

The "Log output" application: on startup it picks a random UUID, then prints
that UUID plus the current timestamp to stdout every 5 seconds. There's no HTTP
endpoint yet. you read the output straight from the pod logs.
## Build & deploy

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

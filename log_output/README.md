# 1.1 Log output

The very first app. On startup it generates a random UUID, then every 5 seconds
prints that UUID with the current timestamp to stdout:

```
2026-01-01T10:00:00.000Z: 3f7c9a2e-...
```

There is no HTTP endpoint yet, you read the output straight from the pod logs.

## Build & deploy

```bash
docker build -t log-output:v4 .
kubectl apply -f deployment.yaml
```

## Test

```bash
kubectl logs -l app=log-output -f      # a line every 5 seconds: <timestamp>: <uuid>
```

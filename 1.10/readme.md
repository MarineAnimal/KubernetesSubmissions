# 1.10 Sharing data between containers in a pod

The "Log output" app is split into **two containers in the same pod** that share
an `emptyDir` volume mounted at `/shared`:

- **writer**, appends `<timestamp> - <id>` to `/shared/log.txt` every 5 seconds.
- **reader**, an HTTP server that reads `/shared/log.txt` and serves it at `/log`.

Because they're in one pod sharing a volume, the reader sees everything the
writer produces. (The data is ephemeral here, an `emptyDir` is lost when the
pod dies; persisting it is the next exercise, 1.11.)

## Build & deploy

```bash
docker build -t log-output:1.0 .
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress>/log                 # the accumulated log lines
```

# 2.5 ConfigMap for log-output

A ConfigMap that gives log-output two things at once:

- a **file** `information.txt`, mounted as a volume at `/config/information.txt`
- an **env variable** `MESSAGE`

The app reads both and prints them above its usual output:

```
file content: this text is from file
env variable: MESSAGE=hello world
2026-05-18T12:15:17.705Z: 8523ecb1-....
Ping / Pongs: 3
```

Both values come from the one ConfigMap `log-output-config` (in the `exercises`
namespace): `MESSAGE` is injected as an env var via `configMapKeyRef`, and
`information.txt` is mounted as a volume. Nothing is hard-coded in the image.

Code lives under `2.5-fixed/`.

## Build & deploy

```bash
cd 2.5-fixed
docker build -t log-output:1.0 ./log-output

kubectl apply -f k8s/configmap-log-output.yaml
kubectl apply -f k8s/deployment-log-output.yaml
```

(ping-pong from 2.1/2.3 still provides the `Ping / Pongs` count; deploy it too
if it is not already running.)

## Test

```bash
curl http://<ingress>/log
```

The first two lines should be the file content and the `MESSAGE` value from the
ConfigMap. Change either value in `configmap-log-output.yaml`, re-apply, restart
the pod, and the output changes with it.

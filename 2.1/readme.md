# 2.1 Connecting ping-pong and log-output over HTTP

Instead of sharing a file on a volume (like in 1.11), the two apps now talk
over HTTP. Ping-pong keeps the counter and exposes it; log-output asks for it
with a GET request. The volume between them is gone.

- **Ping-pong** (`pingpong/`)
  - `GET /pingpong` → `pong N`, increments the counter.
  - `GET /pongs` → just the number, e.g. `3`. This is the new endpoint
    log-output reads from.
- **Log-output** (`log-output/`)
  - `GET /log` → its usual line plus the count it fetched from ping-pong:
    ```
    2026-05-18T12:15:17.705Z: 8523ecb1-....
    Ping / Pongs: 3
    ```
  - It reaches ping-pong at `http://pingpong-svc/pongs`. `pingpong-svc` is the
    ClusterIP Service name, which Kubernetes DNS resolves from inside the
    cluster. If ping-pong is unreachable it prints `Ping / Pongs: unavailable`
    instead of crashing.

Code lives under `2.1-fixed/`.

## Build & deploy

```bash
cd 2.1-fixed
docker build -t pingpong:1.0 ./pingpong
docker build -t log-output:1.0 ./log-output

kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/service-pingpong.yaml
kubectl apply -f k8s/deployment-log-output.yaml
kubectl apply -f k8s/service-log-output.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress>/pingpong   # pong 1, pong 2, pong 3 ...
curl http://<ingress>/log        # ... Ping / Pongs: 3
```

The count log-output shows should match how many times you hit `/pingpong`,
proving the two apps are talking over HTTP.

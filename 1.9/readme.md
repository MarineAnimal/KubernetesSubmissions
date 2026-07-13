# 1.9 Two apps behind one Ingress

Ping-pong and Log-output run as two separate deployments, both exposed through a
single Ingress that splits by path:

- `/pingpong` → ping-pong app: replies `pong N`, incrementing on each request.
- `/` → log-output app: HTML page with a timestamp and a startup random string.

## Build & deploy

```bash
docker build -t pingpong:1.0 ./pingpong
docker build -t log-output:1.9 ./log-output

kubectl apply -f k8s/            # pingpong + log-output deployments, services, ingress
```

(In `k8s/`, `deployment.yaml`/`service.yaml` are ping-pong and
`deployment-log-output.yaml`/`service-log-output.yaml` are log-output.)

## Test

```bash
curl http://<ingress>/pingpong            # pong 1, pong 2, pong 3 ...
curl http://<ingress>/                    # log-output HTML (timestamp + random string)
```

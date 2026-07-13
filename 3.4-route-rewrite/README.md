# 3.4 Route Rewrite

Builds on 3.3. The HTTPRoute now **rewrites the path**: `/pingpong` is stripped to
`/` before the request reaches the Ping-pong app, so the app only has to serve `/`
instead of matching `/pingpong` itself.

- HTTPRoute `/pingpong` rule gains a `URLRewrite` filter → `ReplacePrefixMatch: /`.
- The Ping-pong app is updated to respond at `/` accordingly (the rewrite is
  transparent to the caller, they still hit `/pingpong`).

## Deploy (PowerShell)

Same set as 3.3 (namespace, configmap, both apps, gateway, httproute). If 3.3 is
already applied, only these two changed:

```powershell
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/httproute.yaml
```

Full apply from scratch:

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap-log-output.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/service-pingpong.yaml
kubectl apply -f k8s/deployment-log-output.yaml
kubectl apply -f k8s/service-log-output.yaml
kubectl apply -f k8s/gateway.yaml
kubectl apply -f k8s/httproute.yaml
```

## Test

```powershell
kubectl get gateway -n exercises          # wait for an ADDRESS
curl.exe http://GATEWAY-IP/pingpong        # still returns "pong N", rewrite is invisible to the caller
curl.exe http://GATEWAY-IP/log
```

## Cleanup (save credits)

```powershell
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

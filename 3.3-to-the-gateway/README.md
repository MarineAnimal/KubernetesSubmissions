# 3.3 To the Gateway

Same two apps as 3.2 (Log output + Ping-pong on GKE), but exposed through the
**Gateway API** instead of an Ingress.

- **Gateway** `exercises-gateway` (class `gke-l7-global-external-managed`) provisions
  the external L7 load balancer.
- **HTTPRoute** `exercises-route` sends `/pingpong` → `pingpong-svc`, everything else
  (`/`) → `log-output-svc`.

The Gateway API CRDs come preinstalled on GKE, so there's no extra install step.

## Deploy (PowerShell)

Assumes the `dwk-cluster` and the images from 3.2 already exist.

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
kubectl get gateway -n exercises   # wait for an ADDRESS (takes a few minutes)
curl.exe http://GATEWAY-IP/pingpong
curl.exe http://GATEWAY-IP/log
```

Gateway provisioning is slow (like the Ingress in 3.2), and 404/502s from the IP
while GCP finishes setting up the load balancer are normal.

## Cleanup (save credits)

```powershell
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

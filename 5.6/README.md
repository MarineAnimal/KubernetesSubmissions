# Exercise 5.6, Trying serverless (Knative Serving on k3d)

Installs the **Knative Serving** component on a fresh **k3d** cluster (no Traefik,
Kubernetes 1.34), with **Kourier** as the network layer and **Magic DNS (sslip.io)**,
then runs the getting-started `hello` service and shows serverless scale-to-zero.

> This exercise uses its own **k3d** cluster, separate from the `docker-desktop`
> cluster used in 5.1–5.5.

## 1. Create the k3d cluster (no Traefik, K8s 1.34)

```bash
k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer \
  --agents 2 --k3s-arg "--disable=traefik@server:0" \
  --image rancher/k3s:v1.34.1-k3s1
```

Traefik is disabled because Knative brings its own ingress (Kourier). The
`-p 8081:80@loadbalancer` maps host `localhost:8081` → the Kourier gateway.

## 2. Install Knative Serving (v1.22.1)

```bash
V=knative-v1.22.1
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-core.yaml

# Network layer: Kourier
kubectl apply -f https://github.com/knative/net-kourier/releases/download/$V/kourier.yaml
kubectl patch configmap/config-network -n knative-serving --type merge \
  -p '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'

# Magic DNS (sslip.io), auto-sets config-domain to <clusterIP>.sslip.io
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-default-domain.yaml
```

Verify everything is Running:

```bash
kubectl get pods -n knative-serving
kubectl get pods -n kourier-system
```

### Note on the CrashLoopBackOff the exercise warns about

The exercise says pods (webhook / net-kourier-controller / controller) may
`CrashLoopBackOff`. On this setup (k3d 5.9, k3s v1.34.1, Knative 1.22.1) they came
up cleanly. The usual cause when it *does* happen is the node's **inotify limits**
being too low, the crashing pod's logs show `too many open files`. Fix by raising
them on the host / in each k3d node, e.g.:

```bash
# on the Docker host (WSL2 / Docker Desktop VM)
sysctl -w fs.inotify.max_user_instances=512
sysctl -w fs.inotify.max_user_watches=524288
# or per node: docker exec <k3d-node> sh -c 'sysctl -w fs.inotify.max_user_instances=512'
```

## 3. Deploy and test the `hello` service

```bash
kubectl apply -f manifests/hello-ksvc.yaml
kubectl get ksvc hello
# URL: http://hello.default.172.19.0.3.sslip.io   READY=True
```

Access it from the host through the Kourier gateway on `localhost:8081` using the
ksvc URL as the `Host` header:

```bash
HOST=$(kubectl get ksvc hello -o jsonpath='{.status.url}' | sed 's|http://||')
curl -H "Host: $HOST" http://localhost:8081/
# -> Hello Knative on k3d (5.6)!
```

## 4. Serverless scale-to-zero (observed)

- Before the first request: **0 pods** (scaled to zero).
- On the `curl`, Knative's activator spun up a pod on demand → request served.
- After ~72s with no traffic, the pod **scaled back to zero**:

```
t=64s: hello pods=1
t=72s: hello pods=0   # SCALED TO ZERO
```

## Cleanup

```bash
kubectl delete -f manifests/hello-ksvc.yaml
# to remove the whole cluster when done with 5.6/5.7:
# k3d cluster delete k3s-default
```

# Exercise 5.1, DummySite operator

A Kubernetes controller (operator) that watches a custom resource called
**DummySite** and serves an HTML copy of the website named in its
`spec.website_url`.

Creating this resource:

```yaml
apiVersion: dummysite.example.com/v1
kind: DummySite
metadata:
  name: example
spec:
  website_url: https://example.com
```

makes the controller create a **Deployment** (an init container fetches the
page with `curl`, an `nginx` container serves it) and a **Service** that
exposes the copy on port 80 inside the cluster.

## Project layout

```
5.1/
├── Dockerfile              # Builds the controller image
├── .dockerignore
├── package.json            # Node.js project, @kubernetes/client-node v1
├── src/
│   └── index.js            # The controller / reconciliation loop
├── k8s/
│   ├── kustomization.yaml  # Applies everything below
│   ├── crd.yaml            # The DummySite CustomResourceDefinition
│   ├── rbac.yaml           # ServiceAccount + ClusterRole + ClusterRoleBinding
│   └── deployment.yaml     # The controller Deployment
├── example-dummysite.yaml  # A sample DummySite for https://example.com
└── README.md
```

## How it works

### Resources the controller creates per DummySite

* **Deployment** `dummysite-<name>`
  * `initContainer` (`curlimages/curl`) downloads `website_url` into a shared
    `emptyDir` volume, retrying temporary failures and falling back to a
    placeholder page if the fetch ultimately fails.
  * `nginx` container serves that volume on port 80.
* **Service** `dummysite-<name>` (ClusterIP) exposes port 80.

Both children carry an `ownerReference` back to the DummySite, so deleting the
DummySite garbage-collects them automatically.

### Reconciliation

The controller is **level-based and idempotent**:

* It lists every DummySite on startup, on every watch event, and every
  30 seconds (`RECONCILE_INTERVAL_MS`).
* For each DummySite it reads the child Deployment/Service and **creates them
  only if missing**. It replaces the Deployment only when `website_url`
  actually changed (tracked via an annotation), so re-running the loop never
  recreates or churns existing resources.
* The watch reconnects automatically if the connection drops, and the periodic
  loop recovers anything that was lost, so the controller heals from
  temporary failures.

### RBAC

`k8s/rbac.yaml` creates a `ServiceAccount` plus a `ClusterRole` /
`ClusterRoleBinding` granting:

* `get`/`list`/`watch` on `dummysites`,
* full CRUD on `deployments` (apps) and `services` (core).

Cluster-scoped so the controller can manage DummySites in any namespace.

## Build the controller image

The controller runs from a container image. Build it and make it available to
your cluster.

```bash
# from the 5.1/ directory
docker build -t dummysite-operator:latest .
```

Load it into your local cluster (pick the one you use):

```bash
# k3d
k3d image import dummysite-operator:latest

# kind
kind load docker-image dummysite-operator:latest

# minikube
minikube image load dummysite-operator:latest
```

(The Deployment uses `imagePullPolicy: IfNotPresent`, so a locally present
image is used without contacting a registry.)

## Deploy

```bash
# from the 5.1/ directory
kubectl apply -k k8s
```

This creates the CRD, the RBAC objects, and the controller Deployment. Watch
the controller start:

```bash
kubectl logs -l app.kubernetes.io/name=dummysite-operator -f
```

## Try it

```bash
kubectl apply -f example-dummysite.yaml

kubectl get dummysites
kubectl get deploy,svc -l app.kubernetes.io/name=dummysite

# Reach the copied page:
kubectl port-forward svc/dummysite-example 8080:80
# then open http://localhost:8080  -> a copy of https://example.com
```

Delete it and the child resources disappear too:

```bash
kubectl delete dummysite example
kubectl get deploy,svc -l app.kubernetes.io/name=dummysite   # gone
```

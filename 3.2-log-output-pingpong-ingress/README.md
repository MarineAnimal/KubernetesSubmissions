# 3.2 Back to Ingress

Deploys "Log output" and "Ping-pong" into your existing GKE cluster
(`dwk-cluster`), both exposed through a single Ingress:

- `/pingpong` → Ping-pong app
- `/` (everything else) → Log-output app

Both apps' code got one small addition: a route on `/` that returns `200`,
because **GKE's Ingress health-checks every backend by GETting `/` and
expects 200**, without it, the Ingress would mark both backends unhealthy
even though their real endpoints (`/pingpong`, `/log`) work fine.

All commands are PowerShell. Replace `YOUR-PROJECT-ID` with your real
Project ID everywhere (e.g. `dwk-gke-501611` from 3.1).

If your cluster was deleted to save credits, recreate it first:
```powershell
gcloud container clusters create dwk-cluster --zone=europe-north1-b --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small
gcloud container clusters get-credentials dwk-cluster --zone=europe-north1-b
```

## Step 1, cd into this folder

```powershell
cd path\to\3.2-log-output-pingpong-ingress
dir
```
Confirm you see `k8s`, `log-output`, `pingpong`, `README.md` directly (watch
out for the double-nested-folder issue from before).

## Step 2, Build and push both images

```powershell
cd pingpong
docker build -t europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.1 .
docker push europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.1
cd ..

cd log-output
docker build -t europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/log-output:1.0 .
docker push europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/log-output:1.0
cd ..
```

(Reusing the same Artifact Registry repo, `dwk-gke`, from 3.1, no new
repo/IAM setup needed, since you already granted the node service account
`artifactregistry.reader` there.)

## Step 3, Update the image paths in the manifests

Open both files and replace the placeholder image line with your real
values:

```powershell
notepad k8s\deployment-pingpong.yaml
notepad k8s\deployment-log-output.yaml
```

In `deployment-pingpong.yaml`, replace:
```yaml
image: REGION-docker.pkg.dev/PROJECT_ID/dwk-gke/pingpong:1.1
```
with:
```yaml
image: europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.1
```

In `deployment-log-output.yaml`, replace:
```yaml
image: REGION-docker.pkg.dev/PROJECT_ID/dwk-gke/log-output:1.0
```
with:
```yaml
image: europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/log-output:1.0
```

Save and close both.

## Step 4, Apply everything

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap-log-output.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/service-pingpong.yaml
kubectl apply -f k8s/deployment-log-output.yaml
kubectl apply -f k8s/service-log-output.yaml
kubectl apply -f k8s/ingress.yaml
```

If you still have the old `pingpong-svc` from 3.1 as `type: LoadBalancer`,
this `apply` will update it in place to `NodePort`, that's expected and
fine, no need to delete it first.

## Step 5, Wait for pods and the Ingress address

```powershell
kubectl get pods -n exercises --watch
```
Ctrl+C once both `pingpong` and `log-output` pods show `Running`.

```powershell
kubectl get ingress -n exercises --watch
```
Ctrl+C once `ADDRESS` shows a real IP (this can take a few minutes,
noticeably longer than a LoadBalancer service, and you may see `404`s or
`502`s from the IP in the meantime while GKE finishes provisioning the L7
load balancer).

## Step 6, Test it

```powershell
curl.exe http://INGRESS-IP/pingpong
curl.exe http://INGRESS-IP/log
```
(replace `INGRESS-IP` with the address from Step 5)

- `/pingpong` should return `pong 1`, `pong 2`, ... incrementing.
- `/log` should return the file content, the `MESSAGE` env var, a
  timestamp + random ID, and the ping/pong count (this will show
  `unavailable` for the ping/pong count, since that requires a `/pongs`
  endpoint on Ping-pong that isn't part of this exercise, that's expected
  and not a bug).

## Cleanup (save credits)

```powershell
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

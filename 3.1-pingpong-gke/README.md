# 3.1 Ping-pong on GKE

The first Google Kubernetes Engine exercise: get a GKE cluster running and
deploy the Ping-pong app to it, exposed with a `LoadBalancer` Service.
`GET /pingpong` returns `pong N`, incrementing on each request.

All commands are PowerShell. Replace `YOUR-PROJECT-ID` with your real Google
Cloud Project ID everywhere.

Note: this folder is double-nested, the actual code and manifests live one level
down in `3.1-pingpong-gke/`. `cd` into it first.

## Step 1, create the cluster (if you don't have one)

```powershell
gcloud container clusters create dwk-cluster --zone=europe-north1-b --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small
gcloud container clusters get-credentials dwk-cluster --zone=europe-north1-b
```

## Step 2, create an Artifact Registry repo (one-time)

```powershell
gcloud artifacts repositories create dwk-gke --repository-format=docker --location=europe-north1
```

## Step 3, build and push the image

```powershell
cd 3.1-pingpong-gke\pingpong
docker build -t europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0 .
docker push europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0
cd ..
```

## Step 4, set the image in the manifest

Open `k8s/deployment-pingpong.yaml` and replace the placeholder line
`image: REGION-docker.pkg.dev/PROJECT_ID/dwk-gke/pingpong:1.0` with your real
value, e.g. `europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0`.

## Step 5, deploy

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/service-pingpong.yaml
```

## Step 6, get the external IP and test

```powershell
kubectl get svc pingpong-svc -n exercises -w
```
Wait for `EXTERNAL-IP` to appear (a minute or two), then:
```powershell
curl.exe http://EXTERNAL-IP/pingpong    # pong 1, pong 2, pong 3 ...
```

## Cleanup (save credits)

```powershell
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

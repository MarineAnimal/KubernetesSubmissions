# 3.1 Pingpong GKE

Deploys the Ping-pong app (from exercise 1.9) to a real GKE cluster,
exposed with a `LoadBalancer` service, as the exercise requires.

All commands are PowerShell. Run them in order.

## Part 1 

```powershell
gcloud -v
gcloud auth login
```

Create a project named `dwk-gke` via https://console.cloud.google.com (or reuse
one you already made), note its **Project ID**, then:

```powershell
gcloud config set project YOUR-PROJECT-ID-HERE
gcloud services enable container.googleapis.com
```

Create the cluster (this takes several minutes):

```powershell
gcloud container clusters create dwk-cluster --zone=europe-north1-b --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small
```

Confirm `kubectl` points at it:

```powershell
kubectl cluster-info
```

You should see a real external IP, not `0.0.0.0`/`127.0.0.1`. If it's local,
run:

```powershell
gcloud container clusters get-credentials dwk-cluster --zone=europe-north1-b
```

## Part 2

GKE nodes run on Google's infrastructure — they can't see images that only
exist in your local Docker Desktop. The image has to be pushed to a
registry Google can pull from. We'll use Artifact Registry.

Enable the API and create a repository (only needs to be done once):

```powershell
gcloud services enable artifactregistry.googleapis.com

gcloud artifacts repositories create dwk-gke `
  --repository-format=docker `
  --location=europe-north1 `
  --description="Images for the devops-with-kubernetes course"
```

(If you picked a different zone/region in Part 1, use its region here too —
just the region, e.g. `europe-north1`, not the zone `europe-north1-b`.)

Let Docker authenticate against Artifact Registry:

```powershell
gcloud auth configure-docker europe-north1-docker.pkg.dev
```

Get your Project ID if you don't have it handy:

```powershell
gcloud config get-value project
```

Build, tag, and push the image (replace `YOUR-PROJECT-ID` with the real
value):

```powershell
cd pingpong

docker build -t europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0 .

docker push europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0

cd ..
```

## Part 3

Open `k8s/deployment-pingpong.yaml` and replace this line:

```yaml
image: REGION-docker.pkg.dev/PROJECT_ID/dwk-gke/pingpong:1.0
```

with your actual values, e.g.:

```yaml
image: europe-north1-docker.pkg.dev/YOUR-PROJECT-ID/dwk-gke/pingpong:1.0
```

(Same value you just pushed to in Part 2.)

## Part 4
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/service-pingpong.yaml
```

Watch the pod come up:

```powershell
kubectl get pods -n exercises --watch
```
Ctrl+C once it's `Running`.

Watch the LoadBalancer service until it gets a real external IP (this can
take a minute or two):

```powershell
kubectl get svc -n exercises --watch
```
Ctrl+C once `EXTERNAL-IP` shows a real address instead of `<pending>`.

## Part 5

```powershell
curl.exe http://EXTERNAL-IP/pingpong
```

Replace `EXTERNAL-IP` with the address from the previous step. Each
request should return an incrementing `pong 1`, `pong 2`, etc. You can also
just open `http://EXTERNAL-IP/pingpong` in a browser and refresh a few
times.


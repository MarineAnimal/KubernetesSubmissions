# 3.5 Project with Kustomize

The project todo-app (from chapters 1–2) deployed with **Kustomize** instead of a
pile of raw `kubectl apply -f` commands.

`kustomization.yaml` bundles the manifests (namespace, deployment, service, ingress,
PVC), pins everything to the `project` namespace, and swaps the deployment's
`PROJECT/IMAGE` placeholder for the real Artifact Registry image + tag — so the
deployment file itself stays image-agnostic.

The app serves a todo list plus a random image that's cached on a PVC
(`/usr/src/app/files`) and refreshed every 10 minutes, so it survives pod restarts.

## Deploy (PowerShell)

```powershell
# build & push the image first (adjust the project id if yours differs)
docker build -t europe-north1-docker.pkg.dev/dwk-gke-501611/dwk-gke/todo-app:1.0 .
docker push europe-north1-docker.pkg.dev/dwk-gke-501611/dwk-gke/todo-app:1.0

# apply the whole kustomization
kubectl apply -k .
```

## Test

```powershell
kubectl get pods -n project
kubectl get ingress -n project     # wait for an ADDRESS
```

Open `http://INGRESS-IP/` in a browser — you should see the todo list and a cached
random image.

## Cleanup (save credits)

```powershell
gcloud container clusters delete dwk-cluster --zone=europe-north1-b
```

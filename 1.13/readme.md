# 1.13 The project — todos + persisted image

The project app now shows **both** a todo list and a random image, with the image
**cached on a PersistentVolume** so it survives pod restarts.

- `GET /` — the page: the cached image + the todo list + a form to add todos.
- `GET /image` — serves the cached image, fetching a fresh one from
  `picsum.photos` only if the cached file is missing or older than 10 minutes
  (uses the file's mtime, so the freshness check survives restarts).
- `POST /add` — adds a todo (max 140 chars).

The image lives at `/usr/src/app/files/image.jpg`, which is a PVC-backed volume
(`project-image-pvc` → `project-image-pv`, a 100Mi hostPath volume).

## Build & deploy

```bash
docker build -t todo-app:1.0 .

kubectl apply -f k8s/persistentvolume.yaml
kubectl apply -f k8s/persistentvolumeclaim.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
kubectl get pods            # todo-app Running
# open the ingress address in a browser:
#   - a random image (persists across pod restarts)
#   - the todo list + add form
```

Restarting the pod keeps the same image (until it's 10 min old), proving the
PersistentVolume works.

# 2.6 The project, no hard-coded config

Cleaning the project so nothing is baked into the source code. Every port, URL,
and setting now comes in as an env variable, defined in a ConfigMap (or the
Deployment). If a required env var is missing, the app throws on startup instead
of quietly using a default, so a misconfiguration fails loudly.

Config now lives in the `project-config` ConfigMap (namespace `project`):

| Variable | Used by | Meaning |
|----------|---------|---------|
| `PORT` | both | port the app listens on |
| `TODO_BACKEND_URL` | todo-app | where to reach todo-backend |
| `IMAGE_SOURCE_URL` | todo-app | where random images come from |
| `IMAGE_DIR` | todo-app | where the cached image is stored |
| `IMAGE_CACHE_MINUTES` | todo-app | how long to cache the image |
| `TODO_MAX_LENGTH` | both | max todo length (140) |

Code lives under `2.6-fixed/`.

## Build & deploy

```bash
cd 2.6-fixed
docker build -t todo-app:1.0 ./todo-app
docker build -t todo-backend:1.0 ./todo-backend

kubectl apply -f k8s/configmap-project.yaml
kubectl apply -f k8s/deployment-todo-backend.yaml
kubectl apply -f k8s/deployment-todo-app.yaml
```

(Services/ingress/PV from 2.2/2.3 are unchanged, keep them applied.)

## Test

App works exactly like 2.2: open the page, add a todo, see the image. To prove
the config is really external, change a value in `configmap-project.yaml`
(e.g. `IMAGE_CACHE_MINUTES`), `kubectl apply` it, restart the pods, and the new
value takes effect without touching the image.

# 2.10 The project, step 13 — Logging & monitoring

This delivers two things:

1. **`todo-backend/`** — updated with request logging (`morgan`) and explicit
   log lines for every todo submission, including rejections when a todo is
   longer than `TODO_MAX_LENGTH` (140, already set in your `project-config`
   ConfigMap from exercise 2.6 — no change needed there).
2. **`monitoring/`** — the four Helm values files for Prometheus, Loki,
   Alloy (`k8s-monitoring`), and Grafana, as described in the course
   material. These still need to be installed into your cluster — Helm
   installs can't be run for you, only the config files can be prepared.

All commands below are PowerShell.

## Part 1 — Deploy the monitoring stack

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create namespace monitoring

cd monitoring

helm upgrade --install prom prometheus-community/prometheus `
  --namespace monitoring `
  --values prom-values.yaml

helm upgrade --install loki grafana/loki `
  --namespace monitoring `
  --values loki-values.yaml

helm upgrade --install k8smon grafana/k8s-monitoring `
  --namespace monitoring `
  --values k8smon-values.yaml

helm upgrade --install grafana grafana/grafana `
  --namespace monitoring `
  --values grafana-values.yaml

cd ..
```

Wait until everything is running:

```powershell
kubectl get pods --namespace monitoring
```

Then open Grafana:

```powershell
kubectl port-forward --namespace monitoring svc/grafana 3000:80
```

Go to http://localhost:3000, log in with `admin` / `admin`.

## Part 2 — Rebuild and redeploy the backend

```powershell
cd todo-backend
docker build -t todo-backend:1.0 .
cd ..

kubectl rollout restart deployment/todo-backend -n project
kubectl get pods -n project --watch
```

Wait for the new `todo-backend` pod to be `Running` (Ctrl+C to stop watching).

## Part 3 — Test the 140-character limit

Port-forward the backend so you can hit it directly:

```powershell
kubectl port-forward svc/todo-backend-svc 3000:80 -n project
```

In another terminal, a normal (valid) todo:

```powershell
curl -X POST http://localhost:3000/todos `
  -H "Content-Type: application/json" `
  -d '{\"todo\": \"A short valid todo\"}'
```

This should return `201` with the updated todo list.

Now a todo over 140 characters:

```powershell
$longTodo = "x" * 150
curl -X POST http://localhost:3000/todos `
  -H "Content-Type: application/json" `
  -d "{\"todo\": \"$longTodo\"}"
```

This should return `400` with:
```json
{"error":"todo must be 140 characters or fewer"}
```

(Postman works the same way: `POST http://localhost:3000/todos`, body raw
JSON `{"todo": "..."}`.)

## Part 4 — See it in Grafana

Back in Grafana (http://localhost:3000, the monitoring one — use a
different local port for the port-forward if both are open at once, e.g.
`3000:80` for Grafana and `3001:80` for the backend), go to **Explore**,
pick the **Loki** datasource, and run:

```
{namespace="project", app="todo-backend"} |= "Rejected"
```

(if your backend pod doesn't have an `app` label matching `todo-backend`,
just use `{namespace="project"} |= "Rejected"` instead — check the actual
label with `kubectl get pods -n project --show-labels`)

You should see the `Rejected todo: length 150 exceeds TODO_MAX_LENGTH (140)`
line from the request you just made. You can also drop the `|= "Rejected"`
filter to see every request logged by `morgan`, or every todo submission
logged by the custom log lines in `index.js`.

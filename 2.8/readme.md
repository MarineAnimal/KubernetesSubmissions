# 2.8 Todos in a Postgres StatefulSet

Same idea as 2.7, now for the project: the todos move from memory into their own
Postgres database, again a **StatefulSet with one replica** (namespace
`project`). The connection details are split between a ConfigMap and a Secret.

- **Postgres** (`postgres-statefulset.yaml`): `postgres:16`, one replica, PVC
  from `volumeClaimTemplates`, headless Service `todo-db-svc`. Its
  user/db/password are read from the same ConfigMap and Secret the backend uses,
  so there is one source of truth.
- **todo-backend** (`todo-backend/`): creates the `todos` table on startup and
  seeds a few rows if it is empty. `GET /todos` reads from the DB, `POST /todos`
  inserts (still capped at 140 chars).
- **Config split**
  - `todo-db-config` **ConfigMap**: `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`.
  - `todo-db-secret` **Secret**: `PGPASSWORD`.

  The backend pulls all of them in with `envFrom` (plus `project-config` from
  2.6).

Code lives under `2.8-fixed/`. Heads up: the password in `secret-todo-db.yaml`
is a throwaway placeholder for the course, not a real credential.

## Build & deploy

```bash
cd 2.8-fixed
docker build -t todo-backend:1.0 ./todo-backend

kubectl apply -f k8s/configmap-todo-db.yaml
kubectl apply -f k8s/secret-todo-db.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/deployment-todo-backend.yaml
```

## Test

```bash
curl -X POST http://<ingress>/todos \
  -H "Content-Type: application/json" \
  -d '{"todo":"survives restarts now"}'

kubectl delete pod -l app=todo-backend -n project
curl http://<ingress>/todos     # the todo you added is still there
```

The todo still being there after the backend pod restarts proves it is stored in
the database.

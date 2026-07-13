# 2.7 Ping-pong counter in a Postgres StatefulSet

The ping-pong counter now lives in a real database instead of memory, so it
survives pod restarts on its own (no shared volume needed). Postgres runs as a
**StatefulSet with one replica** in the `exercises` namespace.

- **Postgres** (`postgres-statefulset.yaml`): `postgres:16`, one replica, its
  data on a `volumeClaimTemplates` PVC, fronted by a headless Service
  `postgres-svc`.
- **Ping-pong** (`pingpong/`): on startup it creates the `pingpong_counter`
  table if needed and seeds a row at 0. `GET /pingpong` does an
  `UPDATE ... count + 1 RETURNING count`; `GET /pongs` reads the current value.
  It retries the connection a few times at boot, so it is fine if Postgres is
  not ready the instant ping-pong starts.

DB connection settings come from env vars (`PGHOST`, `PGUSER`, etc.); the `pg`
library picks those up automatically.

Code lives under `2.7-fixed/`.

## Build & deploy

```bash
cd 2.7-fixed
docker build -t pingpong:1.0 ./pingpong

kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
```

Tip: to check Postgres is reachable before wiring the app, the course's
throwaway debug pod works well:
```bash
kubectl run -it --rm --restart=Never --image postgres psql-debug -n exercises -- sh
# then: psql postgres://pingpong:pingpong@postgres-svc/pingpong
```

## Test

```bash
curl http://<ingress>/pingpong        # pong 1, pong 2, pong 3 ...
kubectl delete pod -l app=pingpong -n exercises
curl http://<ingress>/pingpong        # continues at pong 4, not pong 1
```

The count picking up where it left off after the restart proves it is stored in
the database, not in the pod's memory.

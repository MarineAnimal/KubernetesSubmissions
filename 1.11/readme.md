# 1.11 Persisting data — ping-pong count on a shared volume

Ping-pong and Log-output are now **two separate pods that share one
PersistentVolume**. Ping-pong writes its counter to a file on the volume, and
Log-output reads that same file — so the count survives pod restarts and is
visible to the other app.

- `GET /pingpong` → `pong N`. Increments the counter and writes it to
  `/shared/pongs.txt`. On startup it reads the file back, so restarting the pod
  continues from where it left off instead of resetting to 0.
- `GET /` → Log-output's page:
  ```
  2026-07-13T10:20:00.000Z: a1b2c3d4
  Ping / Pongs: 3
  ```
  The timestamp + random string are its own; `Ping / Pongs` is read live from
  the shared file that ping-pong writes.

Both pods mount the same PVC (`shared-pvc` → `shared-pv`, a 1Gi hostPath volume
with `ReadWriteMany`) at `/shared`. Traffic is split by one Ingress:
`/pingpong` → ping-pong, `/` → log-output.

## Build & deploy

```bash
docker build -t pingpong:1.11 ./pingpong
docker build -t log-output:1.11 ./log-output

kubectl apply -f k8s/persistentvolume.yaml
kubectl apply -f k8s/persistentvolumeclaim.yaml
kubectl apply -f k8s/deployment-pingpong.yaml
kubectl apply -f k8s/deployment-log-output.yaml
kubectl apply -f k8s/service-pingpong.yaml
kubectl apply -f k8s/service-log-output.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress>/pingpong     # pong 1, pong 2, pong 3 ...
curl http://<ingress>/             # ... Ping / Pongs: 3

kubectl delete pod -l app=pingpong # restart ping-pong
curl http://<ingress>/pingpong     # continues at pong 4, not pong 1
```

The counter picking up where it left off after the restart proves the data is
persisted on the volume, not held in memory.

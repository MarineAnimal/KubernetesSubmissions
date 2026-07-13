# 2.3 (and 2.4) Namespaces

Moving things out of the `default` namespace into their own namespaces:

- **2.3**: a namespace called `exercises` for the exercise apps (log-output and
  ping-pong). Manifests are under `2.3-fixed/k8s-exercises/`.
- **2.4**: a namespace called `project` for the project apps (todo-app,
  todo-backend, and their PV/PVC). Manifests are under `2.3-fixed/k8s-project/`.

Both exercises landed in this one folder, so the `2.4` release points here too
(`.../tree/2.4/2.3/2.3-fixed`, at the `k8s-project/` part). From here on,
exercise apps go in `exercises` and project apps go in `project`.

Every Deployment/Service/etc. now has a `namespace:` field, and each set has its
own `namespace.yaml`.

## Deploy

```bash
cd 2.3-fixed

# exercises namespace (log-output + ping-pong)
kubectl apply -f k8s-exercises/namespace.yaml
kubectl apply -f k8s-exercises/

# project namespace (todo-app + todo-backend)
kubectl apply -f k8s-project/namespace.yaml
kubectl apply -f k8s-project/
```

(Images `log-output:1.0`, `pingpong:1.0`, `todo-app:1.0`, `todo-backend:1.0`
are the same ones built in 2.1 and 2.2.)

## Test

```bash
kubectl get pods -n exercises      # log-output + pingpong Running
kubectl get pods -n project        # todo-app + todo-backend Running
kubectl get ns                     # exercises and project both listed
```

The apps behave exactly as in 2.1/2.2; this exercise is only about *where* they
run, not what they do.

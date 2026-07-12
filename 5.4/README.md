# Exercise 5.4 — Wikipedia with init and sidecar

A single Pod that serves Wikipedia pages from nginx, using an **init container**
and a **native sidecar** that share an `emptyDir` mounted at nginx's web root.

## Containers

- **nginx** (main) — `nginx:1.27-alpine`, serves `/usr/share/nginx/html`.
- **fetch-initial** (init container) — curls
  `https://en.wikipedia.org/wiki/Kubernetes` once at startup and saves it as
  `index.html` in the shared volume, so there's content before nginx starts.
- **refresher** (native sidecar = `initContainer` with `restartPolicy: Always`) —
  loops forever: sleep a random **5–15 min**, then curl
  `https://en.wikipedia.org/wiki/Special:Random` and overwrite `index.html`.

All three share the `www` `emptyDir` volume, so whatever init/sidecar write is
immediately served by nginx.

## Deploy

```bash
kubectl apply -f manifests/wikipedia.yaml
kubectl rollout status deployment/wikipedia -n default
```

## View it

```bash
kubectl port-forward -n default svc/wikipedia-svc 8080:80
# open http://localhost:8080  → the Kubernetes Wikipedia article
```

(The page renders unstyled — only the HTML is fetched, not Wikipedia's CSS/assets —
which is expected and fine for this exercise.)

## Verify the sidecar refresh (without waiting 5–15 min)

Run the sidecar's exact fetch by hand and confirm nginx serves the new article:

```bash
POD=$(kubectl get pod -n default -l app=wikipedia -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n default $POD -c refresher -- \
  sh -c 'curl -sL https://en.wikipedia.org/wiki/Special:Random -o /www/index.html'
kubectl exec -n default $POD -c nginx -- wget -qO- http://localhost/ | grep -i '<title>'
# -> a random article title, proving the shared-volume write path works
```

The sidecar log shows its cycle:

```bash
kubectl logs -n default $POD -c refresher
# refresher: sleeping 350s (~5 min) before next random article
```

## Cleanup

```bash
kubectl delete -f manifests/wikipedia.yaml
```

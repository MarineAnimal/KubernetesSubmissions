# 1.12 The project, cached random image on a PersistentVolume

An image-caching app: `GET /` shows a random image, and `GET /image` serves it.
The image is fetched from `picsum.photos` and cached on a PersistentVolume at
`/shared/image.jpg`, with a timestamp file next to it. A new image is only
fetched when the cached one is missing or older than 10 minutes, so it survives
pod restarts and doesn't change on every request.

## Build & deploy

```bash
docker build -t image-app:1.0 ./app
kubectl apply -f k8s/pv.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

```bash
curl http://<ingress>/                    # HTML page with the random image
curl -o img.jpg http://<ingress>/image    # the cached image
kubectl delete pod -l app=image-app       # restart, image stays the same (PV), for 10 min
```

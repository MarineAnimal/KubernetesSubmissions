# 1.4 The project, deployment iteration

Another pass at the todo-app Deployment, done the declarative way with a plain
`kubectl apply`. There is no Dockerfile here: 1.4 just re-deploys the same
`todo-app:1.2` image built in exercise 1.2 (a minimal Node server that answers
`My todo app is running. cool! ...` on any request). The point of the exercise
is the Deployment manifest, not the app.

## Deploy

Build `todo-app:1.2` in exercise 1.2 first (this folder has nothing to build),
then:

```bash
kubectl apply -f k8s/deployment.yaml
```

## Test

```bash
kubectl get pods                          # todo-app Running
kubectl port-forward deploy/todo-app 3000:3000
curl localhost:3000                       # "My todo app is running. cool! ..."
```

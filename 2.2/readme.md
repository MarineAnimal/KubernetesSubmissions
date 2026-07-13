# 2.2 The project, a separate todo-backend service

Splitting the project into two services. The **todo-app** keeps serving the
HTML page (and the random image from 1.12/1.13), and a new **todo-backend**
takes care of storing the todos. Todos are kept in memory for now; a database
comes later in 2.8.

- **todo-backend** (`todo-backend/`)
  - `GET /todos` → the list of todos as JSON.
  - `POST /todos` → adds a new todo (body `{ "todo": "..." }`), returns the
    updated list. Rejects empty todos and anything over 140 chars.
- **todo-app** (`todo-app/`)
  - `GET /` → the page: random image, the todo list, and a form to add one.
  - `POST /add` → forwards the new todo to todo-backend, then redirects back.
  - It reaches the backend at `http://todo-backend-svc` (the Service name,
    resolved by cluster DNS). If the backend is down the page still renders,
    just with an empty list.

Code lives under `2.2-fixed/`. The PV/PVC here are for the todo-app's cached
image (carried over from ch1), not for the todos.

## Build & deploy

```bash
cd 2.2-fixed
docker build -t todo-backend:1.0 ./todo-backend
docker build -t todo-app:1.0 ./todo-app

kubectl apply -f k8s/persistentvolume.yaml
kubectl apply -f k8s/persistentvolumeclaim.yaml
kubectl apply -f k8s/deployment-todo-backend.yaml
kubectl apply -f k8s/service-todo-backend.yaml
kubectl apply -f k8s/deployment-todo-app.yaml
kubectl apply -f k8s/service-todo-app.yaml
kubectl apply -f k8s/ingress.yaml
```

## Test

Open the ingress address in a browser: type a todo in the form, submit, and it
should show up in the list. Or straight against the backend:

```bash
curl http://<ingress>/todos                          # current list
curl -X POST http://<ingress>/todos \
  -H "Content-Type: application/json" \
  -d '{"todo":"buy milk"}'                            # add one
```

# 2.9 Hourly "read a random article" CronJob

A CronJob that runs every hour and adds a todo reminding you to read a random
Wikipedia article, like `Read https://en.wikipedia.org/wiki/Some_Article`.

- **Schedule**: `0 * * * *` (top of every hour).
- **How it gets a random article**: `https://en.wikipedia.org/wiki/Special:Random`
  responds with a redirect, and the real article URL is in the `Location`
  header. The job reads that header without following the redirect, fixes it up
  if it comes back protocol-relative (`//en...` becomes `https://en...`), and
  uses it.
- **How it saves the todo**: POSTs `{"todo": "Read <URL>"}` to the todo-backend
  at `TODO_BACKEND_URL` (from the `project-config` ConfigMap), so the reminder
  goes through the same path as any other todo and gets stored in the DB.

It is a small `alpine` + `bash` + `curl` image running `run.sh`. Code lives
under `2.9-fixed-v2/`.

## Build & deploy

```bash
cd 2.9-fixed-v2
docker build -t random-todo:1.0 ./random-todo

kubectl apply -f k8s/cronjob-random-todo.yaml
```

## Test

Waiting an hour is no fun, so trigger a run manually from the CronJob:

```bash
kubectl create job -n project --from=cronjob/random-todo random-todo-test
kubectl logs -n project job/random-todo-test    # shows the random URL it picked
curl http://<ingress>/todos                      # the "Read <URL>" todo appears
```

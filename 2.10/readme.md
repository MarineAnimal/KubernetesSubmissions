# 2.10 Logging and monitoring

Adding logging so every todo sent to the backend can be monitored, and standing
up a monitoring stack (Prometheus + Loki + Alloy + Grafana) to view it.

- **Request logging**: the backend uses `morgan` for access logs, plus explicit
  log lines for every todo submission, including rejections. The 140-char limit
  is enforced in the backend (using `TODO_MAX_LENGTH` from the `project-config`
  ConfigMap set back in 2.6), and a too-long todo is logged as a rejection and
  returned as `400`. Because container stdout is what Alloy/Loki collect, those
  log lines show up in Grafana with no extra plumbing.
- **Monitoring stack**: four Helm values files under `monitoring/` for
  Prometheus, Loki, `k8s-monitoring` (Alloy), and Grafana.

Full step-by-step instructions (installing the Helm charts, rebuilding the
backend, testing the 140-char limit with curl/Postman, and finding the rejected
todos in Grafana's Loki datasource) are in
[`2.10-fixed/README.md`](2.10-fixed/README.md).

Quick version of the limit test:

```bash
# valid todo -> 201
curl -X POST http://<backend>/todos -H "Content-Type: application/json" \
  -d '{"todo":"a short valid todo"}'

# 150 chars -> 400 {"error":"todo must be 140 characters or fewer"}
curl -X POST http://<backend>/todos -H "Content-Type: application/json" \
  -d "{\"todo\":\"$(printf 'x%.0s' {1..150})\"}"
```

Then in Grafana, Explore, Loki datasource:
```
{namespace="project"} |= "Rejected"
```
should show the rejected-todo log line from that second request.

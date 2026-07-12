# broadcaster

Subscribes to todo events on NATS (subject `todos`) and forwards a human-readable
message to an external chat service (Discord/Slack/generic) via a webhook.

- All replicas join the **same NATS queue group**, so scaling to N replicas still
  delivers each message once (at-most-once, no duplicates).
- The target and webhook are configured via env vars: `TARGET` (`discord` | `slack`
  | `generic`) and `WEBHOOK_URL`. With no `WEBHOOK_URL` set, it just logs, so it's
  testable without external credentials.
- `GET /healthz` reports `ok` once connected to NATS, `503` while connecting.

## Note on the Discord webhook

The Discord server and webhook used to test this service were created **solely for
this exercise** — a throwaway resource with no connection to anything real. I'm fully
aware that exposing a webhook URL is a security risk; here it's a deliberate, accepted
trade-off, because a leaked URL for this disposable exercise server has no meaningful
impact. The URL is supplied at runtime via the `WEBHOOK_URL` env var and is **not
committed to this repository**.

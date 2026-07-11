const http = require("http");
const { connect, StringCodec } = require("nats");

const PORT = Number(process.env.PORT || 3000);
const NATS_URL = process.env.NATS_URL || "nats://nats:4222";
const NATS_SUBJECT = process.env.NATS_SUBJECT || "todos";

// All replicas join the SAME queue group. NATS delivers each message to
// exactly one member of a queue group, so scaling the broadcaster to N
// replicas does NOT produce N copies of the message. Core NATS is
// at-most-once, which matches the exercise: a message may (rarely) be
// missed if no subscriber is up, but it is never duplicated.
const QUEUE_GROUP = process.env.NATS_QUEUE_GROUP || "broadcaster";

// Where to forward the message. Supported targets: discord | slack | generic.
const TARGET = (process.env.TARGET || "discord").toLowerCase();
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

const sc = StringCodec();

let natsReady = false;

// Turn a raw todo event into a human-readable line.
function toMessage(event) {
  const text = event?.todo?.text ?? "(unknown)";

  if (event.action === "created") {
    return `A todo was created: "${text}"`;
  }

  if (event.action === "updated") {
    const done = event?.todo?.done ? "done" : "not done";
    return `A todo was updated: "${text}" (${done})`;
  }

  return `Todo event: ${JSON.stringify(event)}`;
}

// Shape the payload for whichever external service is configured.
function toPayload(message) {
  switch (TARGET) {
    case "slack":
      return { text: message };
    case "discord":
      return { content: message };
    case "generic":
    default:
      return { user: "bot", message };
  }
}

async function forward(message) {
  if (!WEBHOOK_URL) {
    // No webhook configured: log only, so the service is still testable
    // (e.g. verifying no duplicates) without external credentials.
    console.log(`[no WEBHOOK_URL set] would forward: ${message}`);
    return;
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(message)),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `Forward failed: ${res.status} ${res.statusText} ${body}`.trim()
      );
    } else {
      console.log(`Forwarded to ${TARGET}: ${message}`);
    }
  } catch (err) {
    console.error("Failed to forward message:", err.message);
  }
}

async function handleMessage(raw) {
  let event;

  try {
    event = JSON.parse(raw);
  } catch {
    // Fall back to treating the raw payload as the message text.
    event = { action: "raw", todo: { text: raw } };
  }

  await forward(toMessage(event));
}

async function subscribe() {
  // Retry the connection in the background so the container comes up
  // immediately and reports not-ready via /healthz until NATS is reachable.
  for (;;) {
    try {
      const nc = await connect({
        servers: NATS_URL,
        name: "broadcaster",
        reconnect: true,
        maxReconnectAttempts: -1,
      });

      natsReady = true;
      console.log(`Connected to NATS at ${NATS_URL}`);
      console.log(
        `Subscribing to "${NATS_SUBJECT}" in queue group "${QUEUE_GROUP}"`
      );

      const sub = nc.subscribe(NATS_SUBJECT, { queue: QUEUE_GROUP });

      // Log when the connection drops so replica behaviour is observable.
      (async () => {
        for await (const status of nc.status()) {
          if (status.type === "disconnect" || status.type === "error") {
            natsReady = false;
          }
          if (status.type === "reconnect") {
            natsReady = true;
          }
          console.log(`NATS status: ${status.type}`);
        }
      })().catch(() => {});

      for await (const m of sub) {
        await handleMessage(sc.decode(m.data));
      }

      // If the subscription iterator ends, the connection closed.
      natsReady = false;
      console.error("NATS subscription ended, retrying...");
    } catch (err) {
      natsReady = false;
      console.error("NATS connection error, retrying in 5s:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Minimal health endpoint so Kubernetes probes have something to hit.
const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    if (natsReady) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "connecting to nats" }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Broadcaster health server listening on ${PORT}`);
  console.log(`Target external service: ${TARGET}`);
});

subscribe().catch((err) => {
  console.error("Fatal broadcaster error:", err.message);
  process.exit(1);
});

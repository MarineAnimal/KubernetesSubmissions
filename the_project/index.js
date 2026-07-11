const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { connect, StringCodec } = require("nats");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Toggled false by POST /break. The health check reports unhealthy once
// this is false, regardless of DB state, so a liveness probe hitting
// /healthz will eventually restart the container and reset this to true.
let isHealthy = true;

const DATA_DIR = "/usr/src/app/files";
const IMAGE_PATH = path.join(DATA_DIR, "image.jpg");
const TEN_MINUTES = 10 * 60 * 1000;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "todo-postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || "todo",
});

// --- NATS: publish an event whenever a todo is created or updated. ---
// The broadcaster service subscribes to these and forwards them to an
// external chat service. Publishing is best-effort: if NATS is briefly
// unreachable the todo operation still succeeds (a missed message is fine,
// per the exercise; only duplicates would be a problem).
const NATS_URL = process.env.NATS_URL || "nats://nats:4222";
const NATS_SUBJECT = process.env.NATS_SUBJECT || "todos";
const sc = StringCodec();
let natsConnection = null;

async function connectNats() {
  try {
    natsConnection = await connect({
      servers: NATS_URL,
      name: "todo-app",
      reconnect: true,
      maxReconnectAttempts: -1,
    });
    console.log(`Connected to NATS at ${NATS_URL}`);

    (async () => {
      for await (const status of natsConnection.status()) {
        console.log(`NATS status: ${status.type}`);
      }
    })().catch(() => {});
  } catch (err) {
    console.error("Could not connect to NATS, retrying in 5s:", err.message);
    setTimeout(connectNats, 5000);
  }
}

function publishTodoEvent(action, todo) {
  if (!natsConnection) {
    console.warn("NATS not connected, skipping event publish");
    return;
  }

  try {
    const payload = JSON.stringify({
      action,
      todo,
      timestamp: new Date().toISOString(),
    });
    natsConnection.publish(NATS_SUBJECT, sc.encode(payload));
    console.log(`Published "${action}" event to NATS`);
  } catch (err) {
    console.error("Failed to publish NATS event:", err.message);
  }
}

async function ensureFreshImage() {
  let needsFetch = true;

  if (fs.existsSync(IMAGE_PATH)) {
    const stats = fs.statSync(IMAGE_PATH);
    const ageMs = Date.now() - stats.mtimeMs;

    if (ageMs < TEN_MINUTES) {
      needsFetch = false;
    }
  }

  if (needsFetch) {
    try {
      const response = await fetch("https://picsum.photos/1200");
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(IMAGE_PATH, buffer);
      console.log(`${new Date().toISOString()}: fetched a new image`);
    } catch (err) {
      console.error(
        "Failed to fetch a new image, keeping the old one if present:",
        err.message
      );
    }
  }
}

function renderPage(todos) {
  return `
  <html>
    <body>
      <h1>The project App</h1>

      <img src="/image" alt="Random image" style="max-width: 600px; display: block; margin-bottom: 20px;" />

      <form method="POST" action="/add">
        <input
          name="todo"
          maxlength="140"
          placeholder="Enter todo (max 140 chars)"
          required
        />
        <button type="submit">Create todo</button>
      </form>

      <ul>
        ${todos
          .map(
            (t) => `<li>
              <label style="text-decoration: ${t.done ? "line-through" : "none"};">
                <input
                  type="checkbox"
                  ${t.done ? "checked" : ""}
                  onchange="fetch('/todos/${t.id}', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ done: this.checked })
                  }).then(() => location.reload())"
                />
                ${t.text}
              </label>
            </li>`
          )
          .join("")}
      </ul>

      <form method="POST" action="/break" style="margin-top: 20px;">
        <button type="submit" style="background: #c0392b; color: white;">Break the app</button>
      </form>

      <p>DevOps with Kubernetes 2026</p>
    </body>
  </html>
  `;
}

async function waitForDb() {
  let attempt = 0;

  while (attempt < 10) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      attempt += 1;
      console.error(`Postgres not ready (attempt ${attempt}):`, err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error("Unable to connect to Postgres after several attempts");
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text VARCHAR(140) NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  await pool.query(`
    ALTER TABLE todos ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT FALSE
  `);
}

async function getTodos() {
  const result = await pool.query(
    "SELECT id, text, done FROM todos ORDER BY id"
  );
  return result.rows;
}

async function addTodoToDb(todo) {
  const result = await pool.query(
    "INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done",
    [todo]
  );
  return result.rows[0];
}

async function setTodoDone(id, done) {
  const result = await pool.query(
    "UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, text, done",
    [done, id]
  );
  return result.rows[0];
}

app.get("/", async (req, res) => {
  try {
    const todos = await getTodos();
    res.send(renderPage(todos));
  } catch (err) {
    console.error("Failed to fetch todos:", err.message);
    res.status(500).send("Failed to load todos");
  }
});

app.get("/healthz", async (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({ status: "unhealthy" });
  }

  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    return res
      .status(500)
      .json({ status: "unhealthy", reason: "database unreachable" });
  }
});

app.post("/break", (req, res) => {
  isHealthy = false;
  console.log("App manually broken via /break");
  res.redirect("/");
});

app.get("/image", async (req, res) => {
  await ensureFreshImage();

  if (fs.existsSync(IMAGE_PATH)) {
    res.sendFile(IMAGE_PATH);
  } else {
    res.status(404).send("No image available yet, try again in a moment.");
  }
});

app.post("/add", async (req, res) => {
  const todo = req.body.todo;

  if (todo && todo.trim().length > 0 && todo.length <= 140) {
    try {
      const created = await addTodoToDb(todo.trim());
      console.log(`New todo created: ${todo.trim()}`);
      publishTodoEvent("created", created);
    } catch (err) {
      console.error("Failed to save todo:", err.message);
    }
  }

  res.redirect("/");
});

app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;

  if (typeof done !== "boolean") {
    return res.status(400).json({ error: "'done' must be a boolean" });
  }

  try {
    const updated = await setTodoDone(id, done);

    if (!updated) {
      return res.status(404).json({ error: "Todo not found" });
    }

    publishTodoEvent("updated", updated);
    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update todo:", err.message);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

async function start() {
  app.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
  });

  await waitForDb();
  await ensureTable();
  connectNats();
}

start().catch((err) => {
  console.error("Failed to start application:", err.message);
  process.exit(1);
});
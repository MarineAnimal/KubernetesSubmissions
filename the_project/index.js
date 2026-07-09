const express = require("express");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

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
        ${todos.map((t) => `<li>${t}</li>`).join("")}
      </ul>

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
      text VARCHAR(140) NOT NULL
    )
  `);
}

async function getTodos() {
  const result = await pool.query("SELECT text FROM todos ORDER BY id");
  return result.rows.map((row) => row.text);
}

async function addTodoToDb(todo) {
  await pool.query("INSERT INTO todos (text) VALUES ($1)", [todo]);
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
      await addTodoToDb(todo.trim());
      console.log(`New todo created: ${todo.trim()}`);
    } catch (err) {
      console.error("Failed to save todo:", err.message);
    }
  }

  res.redirect("/");
});

async function start() {
  await waitForDb();
  await ensureTable();

  app.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start application:", err.message);
  process.exit(1);
});
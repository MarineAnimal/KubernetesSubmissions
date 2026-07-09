const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT;
const TODO_MAX_LENGTH = Number(process.env.TODO_MAX_LENGTH);

for (const [name, value] of Object.entries({ PORT, TODO_MAX_LENGTH })) {
  if (value === undefined || Number.isNaN(value)) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

app.use(express.json());

// pg reads PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE from the
// environment automatically - set via ConfigMap/Secret in the Deployment.
const pool = new Pool();

async function initDb() {
  const maxRetries = 10;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          text VARCHAR(${TODO_MAX_LENGTH}) NOT NULL
        )
      `);

      const { rows } = await pool.query("SELECT COUNT(*) FROM todos");
      if (Number(rows[0].count) === 0) {
        await pool.query("INSERT INTO todos (text) VALUES ($1), ($2), ($3)", [
          "Learn JavaScript",
          "Learn React",
          "Build a project"
        ]);
      }

      console.log("Connected to Postgres and made sure the todos table exists");
      return;
    } catch (err) {
      console.error(`Postgres not ready yet (attempt ${attempt}/${maxRetries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not connect to Postgres after several retries");
}

app.get("/todos", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT text FROM todos ORDER BY id");
    res.json(rows.map((row) => row.text));
  } catch (err) {
    console.error("DB error on GET /todos:", err.message);
    res.status(500).json({ error: "database error" });
  }
});

app.post("/todos", async (req, res) => {
  const todo = req.body && req.body.todo;

  if (!todo || typeof todo !== "string" || todo.trim().length === 0) {
    return res.status(400).json({ error: "todo is required" });
  }

  if (todo.length > TODO_MAX_LENGTH) {
    return res.status(400).json({ error: `todo must be ${TODO_MAX_LENGTH} characters or fewer` });
  }

  try {
    await pool.query("INSERT INTO todos (text) VALUES ($1)", [todo.trim()]);
    const { rows } = await pool.query("SELECT text FROM todos ORDER BY id");
    res.status(201).json(rows.map((row) => row.text));
  } catch (err) {
    console.error("DB error on POST /todos:", err.message);
    res.status(500).json({ error: "database error" });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`todo-backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal: could not initialize database:", err.message);
    process.exit(1);
  });

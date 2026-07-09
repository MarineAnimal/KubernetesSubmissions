const http = require("http");
const { Pool } = require("pg");

let dbReady = false;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "pingpong-postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || "pingpong",
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counter (
      id INTEGER PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    INSERT INTO counter (id, value) VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);
}

// Retries the DB connection in the background instead of blocking startup,
// so the HTTP server (and therefore the readiness probe itself) comes up
// right away. dbReady only flips to true once the connection and table
// are confirmed, which is exactly what the readiness probe reports on.
async function connectToDb() {
  while (true) {
    try {
      await pool.query("SELECT 1");
      await ensureTable();
      dbReady = true;
      console.log("Connected to Postgres");
      return;
    } catch (err) {
      dbReady = false;
      console.error("Postgres not ready yet:", err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function incrementCounter() {
  const result = await pool.query(
    "UPDATE counter SET value = value + 1 WHERE id = 1 RETURNING value"
  );
  return result.rows[0].value;
}

async function readCounter() {
  const result = await pool.query("SELECT value FROM counter WHERE id = 1");
  return result.rows.length > 0 ? result.rows[0].value : 0;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/readyz") {
    if (dbReady) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    } else {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("db not ready");
    }
    return;
  }

  // Read-only endpoint for the log-output app to poll the current count
  // without incrementing it. This is a separate, internal-only path from
  // the public "/" path (which the Gateway rewrites "/pingpong" into).
  if (req.url === "/pongs") {
    if (!dbReady) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("db not ready");
      return;
    }

    try {
      const value = await readCounter();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(String(value));
    } catch (err) {
      console.error("Failed to read counter:", err.message);
      res.writeHead(500);
      res.end("internal error");
    }
    return;
  }

  // The Gateway rewrites "/pingpong" -> "/" before it reaches this app,
  // so the app only needs to handle requests at the root path.
  if (req.url === "/") {
    if (!dbReady) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("db not ready");
      return;
    }

    try {
      const value = await incrementCounter();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("pong " + value);
    } catch (err) {
      console.error("Failed to update counter:", err.message);
      res.writeHead(500);
      res.end("internal error");
    }
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(3000, () => {
  console.log("pingpong server started on port 3000");
});

connectToDb();

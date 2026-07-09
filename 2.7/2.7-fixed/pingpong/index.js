const http = require("http");
const { Pool } = require("pg");

// The pg library automatically picks up PGHOST, PGPORT, PGUSER,
// PGPASSWORD, PGDATABASE from the environment - no need to read
// them manually here.
const pool = new Pool();

async function initDb() {
  const maxRetries = 10;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pingpong_counter (
          id INTEGER PRIMARY KEY,
          count INTEGER NOT NULL
        )
      `);

      await pool.query(`
        INSERT INTO pingpong_counter (id, count)
        VALUES (1, 0)
        ON CONFLICT (id) DO NOTHING
      `);

      console.log("Connected to Postgres and made sure the table exists");
      return;
    } catch (err) {
      console.error(`Postgres not ready yet (attempt ${attempt}/${maxRetries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not connect to Postgres after several retries");
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/pingpong") {
    try {
      const result = await pool.query(
        "UPDATE pingpong_counter SET count = count + 1 WHERE id = 1 RETURNING count"
      );
      const counter = result.rows[0].count;

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("pong " + counter);
    } catch (err) {
      console.error("DB error on /pingpong:", err.message);
      res.writeHead(500);
      res.end("database error");
    }
    return;
  }

  if (req.url === "/pongs") {
    try {
      const result = await pool.query("SELECT count FROM pingpong_counter WHERE id = 1");
      const counter = result.rows[0] ? result.rows[0].count : 0;

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(String(counter));
    } catch (err) {
      console.error("DB error on /pongs:", err.message);
      res.writeHead(500);
      res.end("database error");
    }
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

initDb()
  .then(() => {
    server.listen(3000, () => {
      console.log("pingpong server started on port 3000");
    });
  })
  .catch((err) => {
    console.error("Fatal: could not initialize database:", err.message);
    process.exit(1);
  });

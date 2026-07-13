const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const COUNTER_FILE = "/shared/pongs.txt";

// Restore the counter from the shared volume so it survives pod restarts.
let counter = 0;
try {
  const saved = parseInt(fs.readFileSync(COUNTER_FILE, "utf8").trim(), 10);
  if (!Number.isNaN(saved)) counter = saved;
} catch (err) {
  fs.writeFileSync(COUNTER_FILE, "0");
}

app.get("/pingpong", (req, res) => {
  counter += 1;
  fs.writeFileSync(COUNTER_FILE, String(counter));
  res.send(`pong ${counter}`);
});

app.listen(PORT, () => {
  console.log(`pingpong running on port ${PORT}`);
});

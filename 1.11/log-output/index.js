const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const COUNTER_FILE = "/shared/pongs.txt";

// Random string generated once on startup.
const randomString = Math.random().toString(36).substring(2, 15);

function readPongs() {
  try {
    return fs.readFileSync(COUNTER_FILE, "utf8").trim() || "0";
  } catch (err) {
    return "0";
  }
}

setInterval(() => {
  console.log(`${new Date().toISOString()}: ${randomString}`);
}, 5000);

app.get("/", (req, res) => {
  const timestamp = new Date().toISOString();
  res.set("Content-Type", "text/plain");
  res.send(`${timestamp}: ${randomString}\nPing / Pongs: ${readPongs()}`);
});

app.listen(PORT, () => {
  console.log(`log-output running on port ${PORT}`);
});

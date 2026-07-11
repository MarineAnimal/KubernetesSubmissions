const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Path where the ConfigMap's information.txt is mounted as a volume.
const CONFIG_FILE_PATH = "/config/information.txt";

// Random string, generated once on startup, kept in memory.
const randomId = Math.random().toString(36).substring(2, 10);

console.log(`Log-output started with ID: ${randomId}`);

// Keep logging to stdout every 5s, so `kubectl logs` still works as in 1.1.
setInterval(() => {
  console.log(`${new Date().toISOString()}: ${randomId}`);
}, 5000);

// Tracks whether the last attempt to reach the ping-pong app succeeded.
// The readiness probe reports on this flag directly.
let pingpongReachable = false;

// Polls "pingpong-svc" in the background so readiness reflects live
// connectivity without blocking every request on a fresh check.
async function pollPingpong() {
  while (true) {
    try {
      const response = await fetch("http://pingpong-svc/pongs");
      pingpongReachable = response.ok;
    } catch (err) {
      pingpongReachable = false;
      console.error("Failed to reach ping-pong app:", err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

app.get("/readyz", (req, res) => {
  if (pingpongReachable) {
    res.status(200).send("ok");
  } else {
    res.status(503).send("pingpong not reachable");
  }
});

// GKE's Ingress health check does a GET on "/" and expects 200, even
// though this app's real content lives at "/log". Without this route
// the Ingress would mark the backend unhealthy.
app.get("/", (req, res) => {
  res.status(200).send("ok");
});

app.get("/log", async (req, res) => {
  let pongCount = "unavailable";

  try {
    // "pingpong-svc" is the ping-pong app's Service name, resolvable via
    // Kubernetes' internal DNS from any pod in the cluster.
    const response = await fetch("http://pingpong-svc/pongs");
    pongCount = await response.text();
  } catch (err) {
    console.error("Failed to reach ping-pong app:", err.message);
  }

  let fileContent = "unavailable";
  try {
    fileContent = fs.readFileSync(CONFIG_FILE_PATH, "utf8").trim();
  } catch (err) {
    console.error("Failed to read ConfigMap file:", err.message);
  }

  const envMessage = process.env.MESSAGE || "unavailable";

  res.type("text/plain").send(
    `file content: ${fileContent}\n` +
    `env variable: MESSAGE=${envMessage}\n` +
    `${new Date().toISOString()}: ${randomId}.\n` +
    `Ping / Pongs: ${pongCount}`
  );
});

app.listen(PORT, () => {
  console.log(`log-output running on port ${PORT}`);
});

pollPingpong();

//hope this works

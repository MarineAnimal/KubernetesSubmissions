const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Random string, generated once on startup, kept in memory.
const randomId = Math.random().toString(36).substring(2, 10);

console.log(`Log-output started with ID: ${randomId}`);

// Keep logging to stdout every 5s, so `kubectl logs` still works as in 1.1.
setInterval(() => {
  console.log(`${new Date().toISOString()}: ${randomId}`);
}, 5000);

app.get("/log", async (req, res) => {
  let pongCount = "unavailable";

  try {
    // "pingpong-svc" is the ping-pong app's ClusterIP Service name,
    // resolvable via Kubernetes' internal DNS from any pod in the cluster.
    const response = await fetch("http://pingpong-svc/pongs");
    pongCount = await response.text();
  } catch (err) {
    console.error("Failed to reach ping-pong app:", err.message);
  }

  res.type("text/plain").send(
    `${new Date().toISOString()}: ${randomId}.\nPing / Pongs: ${pongCount}`
  );
});

app.listen(PORT, () => {
  console.log(`log-output running on port ${PORT}`);
});

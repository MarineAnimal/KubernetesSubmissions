// Log-output app for 5.7. It calls the serverless ping-pong Knative service and
// shows the returned pong count in its log and at "/".
//
// IMPORTANT: it calls ping-pong by its FULLY QUALIFIED DNS name
// (http://pingpong.exercises.svc.cluster.local/pingpong). The short name would
// hit Knative's host-based routing and fail; the FQDN resolves cleanly to the
// cluster-local Service that Knative creates for the ksvc.
//
// We use the http module with `agent: false` (a fresh TCP connection per
// request) instead of keep-alive/fetch. Knative's Kourier gateway reconfigures
// routing as revisions come and go, and a pinned keep-alive socket can end up
// stuck on stale routing (returning empty bodies). A fresh connection each time
// makes the poller resilient to that and to start-order races.
const express = require("express");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const PINGPONG_URL =
  process.env.PINGPONG_URL ||
  "http://pingpong.exercises.svc.cluster.local/pingpong";

const randomId = Math.random().toString(36).substring(2, 10);
let latestPong = "unavailable";

function fetchPong() {
  return new Promise((resolve) => {
    const req = http.get(PINGPONG_URL, { agent: false }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        latestPong = res.statusCode === 200 ? data.trim() : "unavailable";
        resolve();
      });
    });
    req.on("error", (err) => {
      latestPong = "unavailable";
      console.error("Failed to reach ping-pong:", err.message);
      resolve();
    });
    req.setTimeout(4000, () => req.destroy(new Error("timeout")));
  });
}

setInterval(async () => {
  await fetchPong();
  console.log(`${new Date().toISOString()}: ${randomId} | ${latestPong}`);
}, 3000);

app.get("/", (req, res) => {
  res.type("text/plain").send(
    `${new Date().toISOString()}: ${randomId}\n` +
    `Ping / Pongs: ${latestPong}\n`
  );
});

app.listen(PORT, () => console.log(`log-output running on port ${PORT}`));

fetchPong();

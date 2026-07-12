// Log-output app, Service Mesh edition. It periodically calls the greeter
// service (a stable name, "greeter-svc") over HTTP and includes the returned
// greeting in both its stdout log and its "/" endpoint. Because the greeter
// call goes through the ambient mesh + waypoint, the 75/25 HTTPRoute split is
// what decides which greeter version answers each request.
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const GREETER_URL = process.env.GREETER_URL || "http://greeter-svc/";

// Random per-pod id, kept in memory (same idea as earlier log-output exercises).
const randomId = Math.random().toString(36).substring(2, 10);
let latestGreeting = "unavailable";

async function fetchGreeting() {
  try {
    const response = await fetch(GREETER_URL);
    latestGreeting = (await response.text()).trim();
  } catch (err) {
    latestGreeting = "unavailable";
    console.error("Failed to reach greeter:", err.message);
  }
}

// Poll fast so the traffic graph fills quickly and the log stays fresh.
setInterval(async () => {
  await fetchGreeting();
  console.log(`${new Date().toISOString()}: ${randomId} | greeting: ${latestGreeting}`);
}, 1000);

app.get("/", (req, res) => {
  res.type("text/plain").send(
    `${new Date().toISOString()}: ${randomId}\n` +
    `greeting: ${latestGreeting}\n`
  );
});

app.listen(PORT, () => console.log(`log-output running on port ${PORT}`));

fetchGreeting();

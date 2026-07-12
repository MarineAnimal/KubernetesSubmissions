// Ping-pong app — deployed as a Knative Service (serverless) in exercise 5.7.
// GET /pingpong increments an in-memory counter and returns "pong N".
// Because the log-output app polls it continuously the revision stays warm,
// so the counter keeps climbing instead of resetting on a cold start.
const http = require("http");

let counter = 0;
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    counter = counter + 1;
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("pong " + counter);
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  console.log("pingpong server started on port " + PORT);
});

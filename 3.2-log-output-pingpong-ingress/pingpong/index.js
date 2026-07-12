const http = require("http");

let counter = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
    counter = counter + 1;

    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("pong " + counter)
    return;
  }

  // GKE's Ingress health check does a GET on "/" and expects 200, even
  // though this app is mapped to serve from "/pingpong". Without this,
  // the Ingress would mark the backend unhealthy.
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("ok")
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(3000, () => {
  console.log("pingpong server started on port 3000")
});

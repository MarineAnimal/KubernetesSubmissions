const http = require("http");

let counter = 0;

const server = http.createServer((req, res) => {
  // The Gateway rewrites "/pingpong" -> "/" before it reaches this app,
  // so the app only needs to handle requests at the root path.
  if (req.url === "/") {
    counter = counter + 1;

    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("pong " + counter)
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(3000, () => {
  console.log("pingpong server started on port 3000")
});

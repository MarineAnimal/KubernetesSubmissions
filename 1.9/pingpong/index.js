const http = require("http");

let counter = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/pingpong") {
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
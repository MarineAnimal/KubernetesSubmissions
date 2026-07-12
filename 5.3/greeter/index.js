// Tiny zero-dependency greeter. ONE image serves both versions; the
// greeting text and version label come from env vars so greeter-v1 and
// greeter-v2 differ only in their Deployment spec.
const http = require("http");

const GREETING = process.env.GREETING || "Hello";
const VERSION = process.env.VERSION || "v1";
const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${GREETING} from greeter ${VERSION}`);
  })
  .listen(PORT, () => console.log(`greeter ${VERSION} listening on ${PORT}`));

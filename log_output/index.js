const { randomUUID } = require("crypto");

const id = randomUUID();

console.log("Log output started");

function log() {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${id}`);
}

log();
setInterval(log, 5000);

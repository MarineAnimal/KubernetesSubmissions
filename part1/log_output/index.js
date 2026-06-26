const { v4: uuidv4 } = require("uuid");

const id = uuidv4();

console.log("Log output started");

function log() {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${id}`);
}

log(); // print immediately

setInterval(log, 5000);

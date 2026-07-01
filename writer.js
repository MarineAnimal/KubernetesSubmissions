const fs = require("fs");

const file = "/shared/log.txt";

function randomString() {
  return Math.random().toString(36).substring(2, 10);
}

const id = randomString()

console.log("Writer started:", id);

setInterval(() => {
  const line = `${new Date().toISOString()} - ${id}\n`
  fs.appendFileSync(file, line);
  console.log("wrote line")
}, 5000);
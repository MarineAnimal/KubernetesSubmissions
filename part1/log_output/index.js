const { v4: uuidv4 } = require("uuid");

const id = uuidv4();

console.log("Log output started");

setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${id}`);
}, 5000);

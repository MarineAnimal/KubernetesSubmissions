const fs = require("fs")

const FILE = "/shared/log.txt"

const id = Math.random().toString(36).substring(2, 8)

setInterval(() => {
  const line = `${new Date().toISOString()} - ${id}\n`
  fs.appendFileSync(FILE, line)
  console.log("wrote line")
}, 5000)
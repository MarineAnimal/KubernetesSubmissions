const express = require("express")
const fs = require("fs")
const path = require("path")

const app = express()

const FILE = "/shared/log.txt"

// ensure file exists
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, "")
}

// generate random string ON STARTUP
const randomId = Math.random().toString(36).substring(2, 10)

console.log("Log-output started with ID:", randomId)

// write every 5 seconds
setInterval(() => {
  const line = `${new Date().toISOString()} - ${randomId}\n`
  fs.appendFileSync(FILE, line)
}, 5000)

// serve logs
app.get("/log", (req, res) => {
  const data = fs.readFileSync(FILE, "utf8")
  res.send(`<pre>${data}</pre>`)
})

app.listen(3000, () => {
  console.log("log-output running on port 3000")
})
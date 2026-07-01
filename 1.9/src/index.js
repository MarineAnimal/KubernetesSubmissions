const express = require("express")
const app = express()

let count = 0

app.get("/pingpong", function (req, res) {
  count = count + 1
  res.send("pong " + count)
})

const port = 3000
app.listen(port, () => {
  console.log("server running on port " + port)
})
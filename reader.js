const express = require("express");
const fs = require("fs");

const app = express()
const file = "/shared/log.txt"

app.get("/", (req, res) => {
  try {
    const data = fs.readFileSync(file, "utf8");
    res.send(`<pre>${data}</pre>`);
  } catch (err) {
    res.send("no data yet");
  }
});

app.listen(3000, () => {
  console.log("Reader running on 3000")
});
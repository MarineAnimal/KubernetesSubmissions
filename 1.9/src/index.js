const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

let counter = 0;

app.get("/pingpong", (req, res) => {
  counter++;
  res.send(`pong ${counter}`);
});

app.listen(PORT, () => {
  console.log(`Pingpong app started on port ${PORT}`);
});
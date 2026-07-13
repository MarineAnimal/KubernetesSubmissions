const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// generate random string ONCE on startup
const randomString = Math.random().toString(36).substring(2, 15);

setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);

app.get("/", (req, res) => {
  const timestamp = new Date().toISOString();
  res.send(`
    <html>
      <body>
        <p>${timestamp}</p>
        <p>${randomString}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

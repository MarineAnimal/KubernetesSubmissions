const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const greeting = process.env.DEMO_GREETING;
const farewell = process.env.DEMO_FAREWELL;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>${greeting}</h1>
        <p>${farewell}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
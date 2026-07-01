const express = require("express")
const fs = require("fs")
const axios = require("axios")

const app = express()

const IMAGE_PATH = "/shared/image.jpg"
const TIME_PATH = "/shared/timestamp.txt"

const TEN_MIN = 10 * 60 * 1000

async function fetchImageIfNeeded() {
  const now = Date.now()

  let lastFetch = 0

  if (fs.existsSync(TIME_PATH)) {
    lastFetch = Number(fs.readFileSync(TIME_PATH, "utf8"))
  }

  const exists = fs.existsSync(IMAGE_PATH)

  // still valid → reuse image
  if (exists && now - lastFetch < TEN_MIN) {
    return
  }

  console.log("Fetching new image...")

  const response = await axios.get("https://picsum.photos/1200", {
    responseType: "stream"
  })

  const writer = fs.createWriteStream(IMAGE_PATH)
  response.data.pipe(writer)

  await new Promise((resolve) => {
    writer.on("finish", resolve)
  })

  fs.writeFileSync(TIME_PATH, String(now))
}

app.get("/", async (req, res) => {
  await fetchImageIfNeeded()
  res.send(`
    <h1>Random Image (cached 10 min)</h1>
    <img src="/image" style="max-width:100%" />
  `)
})

app.get("/image", (req, res) => {
  res.sendFile(IMAGE_PATH)
})

app.listen(3000, () => {
  console.log("App running on port 3000")
})
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// --- All configuration below comes from env vars, set via ConfigMap/Deployment. ---
const PORT = process.env.PORT;
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL;
const IMAGE_SOURCE_URL = process.env.IMAGE_SOURCE_URL;
const IMAGE_DIR = process.env.IMAGE_DIR;
const IMAGE_CACHE_MINUTES = Number(process.env.IMAGE_CACHE_MINUTES);
const TODO_MAX_LENGTH = Number(process.env.TODO_MAX_LENGTH);

for (const [name, value] of Object.entries({
  PORT, TODO_BACKEND_URL, IMAGE_SOURCE_URL, IMAGE_DIR, IMAGE_CACHE_MINUTES, TODO_MAX_LENGTH
})) {
  if (value === undefined || Number.isNaN(value)) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

app.use(express.urlencoded({ extended: true }));

const IMAGE_PATH = path.join(IMAGE_DIR, "image.jpg");
const CACHE_MS = IMAGE_CACHE_MINUTES * 60 * 1000;

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

async function fetchTodos() {
  try {
    const response = await fetch(`${TODO_BACKEND_URL}/todos`);
    return await response.json();
  } catch (err) {
    console.error("Failed to reach todo-backend:", err.message);
    return [];
  }
}

// Fetches a new image only if we don't have one yet, or the one we have
// is older than IMAGE_CACHE_MINUTES. Using the file's own mtime (instead
// of an in-memory timestamp) means this survives container restarts/crashes.
async function ensureFreshImage() {
  let needsFetch = true;

  if (fs.existsSync(IMAGE_PATH)) {
    const stats = fs.statSync(IMAGE_PATH);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < CACHE_MS) {
      needsFetch = false;
    }
  }

  if (needsFetch) {
    try {
      const response = await fetch(IMAGE_SOURCE_URL);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(IMAGE_PATH, buffer);
      console.log(`${new Date().toISOString()}: fetched a new image`);
    } catch (err) {
      console.error("Failed to fetch a new image, keeping the old one if present:", err.message);
    }
  }
}

function renderPage(todos) {
  return `
  <html>
    <body>
      <h1>The project App</h1>

      <img src="/image" alt="Random image" style="max-width: 600px; display: block; margin-bottom: 20px;" />

      <form method="POST" action="/add">
        <input
          name="todo"
          maxlength="${TODO_MAX_LENGTH}"
          placeholder="Enter todo (max ${TODO_MAX_LENGTH} chars)"
          required
        />
        <button type="submit">Create todo</button>
      </form>

      <ul>
        ${todos.map(t => `<li>${t}</li>`).join("")}
      </ul>

      <p>DevOps with Kubernetes 2025</p>
    </body>
  </html>
  `;
}

app.get("/", async (req, res) => {
  const todos = await fetchTodos();
  res.send(renderPage(todos));
});

app.get("/image", async (req, res) => {
  await ensureFreshImage();

  if (fs.existsSync(IMAGE_PATH)) {
    res.sendFile(IMAGE_PATH);
  } else {
    res.status(404).send("No image available yet, try again in a moment.");
  }
});

app.post("/add", async (req, res) => {
  const todo = req.body.todo;

  if (todo && todo.trim().length > 0 && todo.length <= TODO_MAX_LENGTH) {
    try {
      await fetch(`${TODO_BACKEND_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: todo.trim() })
      });
    } catch (err) {
      console.error("Failed to save todo via todo-backend:", err.message);
    }
  }

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

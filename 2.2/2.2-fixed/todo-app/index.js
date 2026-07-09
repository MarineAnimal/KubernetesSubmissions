const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Where the cached image lives. This path must match the volumeMount
// path in deployment.yaml, otherwise it won't survive restarts.
const DATA_DIR = "/usr/src/app/files";
const IMAGE_PATH = path.join(DATA_DIR, "image.jpg");
const TEN_MINUTES = 10 * 60 * 1000;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Todos now live in the todo-backend service, not in this app's memory.
// "todo-backend-svc" is that Service's cluster-internal DNS name.
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL || "http://todo-backend-svc";

async function fetchTodos() {
  try {
    const response = await fetch(`${TODO_BACKEND_URL}/todos`);
    return await response.json();
  } catch (err) {
    console.error("Failed to reach todo-backend:", err.message);
    return [];
  }
}

// Fetches a new image from picsum only if we don't have one yet,
// or the one we have is older than 10 minutes. Using the file's
// own mtime (instead of an in-memory timestamp) means this survives
// container restarts/crashes, as required by 1.12.
async function ensureFreshImage() {
  let needsFetch = true;

  if (fs.existsSync(IMAGE_PATH)) {
    const stats = fs.statSync(IMAGE_PATH);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < TEN_MINUTES) {
      needsFetch = false;
    }
  }

  if (needsFetch) {
    try {
      const response = await fetch("https://picsum.photos/1200");
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(IMAGE_PATH, buffer);
      console.log(`${new Date().toISOString()}: fetched a new image`);
    } catch (err) {
      // If the fetch fails (e.g. no internet from the cluster right now),
      // keep serving whatever we already have cached, if anything.
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
          maxlength="140"
          placeholder="Enter todo (max 140 chars)"
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

  if (todo && todo.trim().length > 0 && todo.length <= 140) {
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

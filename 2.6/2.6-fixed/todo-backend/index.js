const express = require("express");

const app = express();

const PORT = process.env.PORT;
const TODO_MAX_LENGTH = Number(process.env.TODO_MAX_LENGTH);

for (const [name, value] of Object.entries({ PORT, TODO_MAX_LENGTH })) {
  if (value === undefined || Number.isNaN(value)) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

app.use(express.json());

let todos = [
  "Learn JavaScript",
  "Learn React",
  "Build a project"
];

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const todo = req.body && req.body.todo;

  if (!todo || typeof todo !== "string" || todo.trim().length === 0) {
    return res.status(400).json({ error: "todo is required" });
  }

  if (todo.length > TODO_MAX_LENGTH) {
    return res.status(400).json({ error: `todo must be ${TODO_MAX_LENGTH} characters or fewer` });
  }

  todos.push(todo.trim());
  res.status(201).json(todos);
});

app.listen(PORT, () => {
  console.log(`todo-backend running on port ${PORT}`);
});

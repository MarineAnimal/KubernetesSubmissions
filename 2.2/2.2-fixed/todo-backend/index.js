const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

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

  if (todo.length > 140) {
    return res.status(400).json({ error: "todo must be 140 characters or fewer" });
  }

  todos.push(todo.trim());
  res.status(201).json(todos);
});

app.listen(PORT, () => {
  console.log(`todo-backend running on port ${PORT}`);
});

const express = require("express")
const app = express()

app.use(express.urlencoded({ extended: true }))

let todos = [
  "Buy milk",
  "Learn Kubernetes",
  "Deploy todo app"
]

function renderPage() {
  return `
  <html>
    <body>
      <h1>Todo App</h1>

      <form method="POST" action="/add">
        <input 
          name="todo" 
          maxlength="140" 
          placeholder="Enter todo (max 140 chars)"
          required
        />
        <button type="submit">Send</button>
      </form>

      <h2>Todos</h2>
      <ul>
        ${todos.map(t => `<li>${t}</li>`).join("")}
      </ul>
    </body>
  </html>
  `
}

/* ✅ NEW: root route */
app.get("/", (req, res) => {
  res.redirect("/todo")
})

app.get("/todo", (req, res) => {
  res.send(renderPage())
})

app.post("/add", (req, res) => {
  const todo = req.body.todo

  if (todo && todo.length <= 140) {
    todos.push(todo)
  }

  res.redirect("/todo")
})

app.listen(3000, () => {
  console.log("Todo app running on 3000")
})
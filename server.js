const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Render automatically assigns a PORT via process.env.PORT
const PORT = process.env.PORT || 3000;

// Path to data file where todos are stored persistently
const DATA_FILE = path.join(__dirname, "todos.json");

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, style.css, script.js)
app.use(express.static(__dirname));

// Helper: Read todos from todos.json
function readTodos() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading todos file:", error);
    return [];
  }
}

// Helper: Write todos to todos.json
function writeTodos(todos) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error("Error writing todos file:", error);
  }
}

// --- API ROUTES ---

// 1. GET all tasks
app.get("/api/todos", (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// 2. POST create a new task
app.post("/api/todos", (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Task text is required" });
  }

  const todos = readTodos();
  const newTask = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.unshift(newTask);
  writeTodos(todos);

  res.status(201).json(newTask);
});

// 3. PUT toggle or update a task's completed status
app.put("/api/todos/:id", (req, res) => {
  const taskId = Number(req.params.id);
  const todos = readTodos();
  const taskIndex = todos.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Toggle completed if not provided, or set to provided value
  if (typeof req.body.completed === "boolean") {
    todos[taskIndex].completed = req.body.completed;
  } else {
    todos[taskIndex].completed = !todos[taskIndex].completed;
  }

  writeTodos(todos);
  res.json(todos[taskIndex]);
});

// 4. DELETE a specific task
app.delete("/api/todos/:id", (req, res) => {
  const taskId = Number(req.params.id);
  let todos = readTodos();
  const initialLength = todos.length;

  todos = todos.filter((t) => t.id !== taskId);

  if (todos.length === initialLength) {
    return res.status(404).json({ error: "Task not found" });
  }

  writeTodos(todos);
  res.json({ message: "Task deleted successfully", id: taskId });
});

// 5. DELETE all completed tasks (Clear Completed)
app.delete("/api/todos", (req, res) => {
  let todos = readTodos();
  todos = todos.filter((t) => !t.completed);
  writeTodos(todos);
  res.json({ message: "Completed tasks cleared", todos });
});

// Root fallback route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
});

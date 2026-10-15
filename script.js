// ==========================================================================
// To-Do List Application - Connected to Backend API
// Supports: REST API (/api/todos) with automatic LocalStorage fallback
// ==========================================================================

// 1. SELECT DOM ELEMENTS
const todoForm = document.getElementById("todo-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const emptyState = document.getElementById("empty-state");
const clearCompletedBtn = document.getElementById("clear-completed-btn");

// API Base URL (relative path works both locally and on Render!)
const API_URL = "/api/todos";

// In-memory tasks state
let tasks = [];

// 2. HELPER FUNCTIONS

// Update the counter and stats bar
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  if (total === 0) {
    taskCount.textContent = "0 tasks";
    clearCompletedBtn.style.display = "none";
  } else {
    taskCount.textContent = `${completed} of ${total} completed`;
    clearCompletedBtn.style.display = completed > 0 ? "inline-block" : "none";
  }
}

// Render the list of tasks onto the webpage
function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "task-content";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.title = "Mark as completed";

    checkbox.addEventListener("change", () => {
      toggleTask(task.id);
    });

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    span.addEventListener("click", () => {
      toggleTask(task.id);
    });

    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(span);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.title = "Delete task";

    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  updateStats();
}

// 3. BACKEND API CALLS (with LocalStorage Fallback)

// Fetch all tasks from the backend
async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Backend not responding");
    tasks = await res.json();
    localStorage.setItem("todo_tasks", JSON.stringify(tasks));
  } catch (err) {
    console.warn("Using offline / LocalStorage mode:", err.message);
    tasks = JSON.parse(localStorage.getItem("todo_tasks")) || [];
  }
  renderTasks();
}

// Add a new task to backend
async function addTask(text) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const newTask = await res.json();
      tasks.unshift(newTask);
    } else {
      throw new Error("Failed to add task on server");
    }
  } catch (err) {
    console.warn("Offline fallback for adding task:", err.message);
    const fallbackTask = { id: Date.now(), text, completed: false };
    tasks.unshift(fallbackTask);
  }

  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
  renderTasks();
}

// Toggle task completed state
async function toggleTask(id) {
  // Optimistic UI update for immediate feedback
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: task.completed }),
    });
  } catch (err) {
    console.warn("Offline fallback for toggling task:", err.message);
  }

  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

// Delete a task
async function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  renderTasks();

  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Offline fallback for deleting task:", err.message);
  }

  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

// Clear all completed tasks
async function clearCompletedTasks() {
  tasks = tasks.filter((t) => !t.completed);
  renderTasks();

  try {
    await fetch(API_URL, { method: "DELETE" });
  } catch (err) {
    console.warn("Offline fallback for clearing completed tasks:", err.message);
  }

  localStorage.setItem("todo_tasks", JSON.stringify(tasks));
}

// 4. EVENT LISTENERS
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text !== "") {
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  }
});

clearCompletedBtn.addEventListener("click", clearCompletedTasks);

// 5. INITIAL LOAD
fetchTasks();

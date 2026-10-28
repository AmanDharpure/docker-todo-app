const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todos_db";

app.use(express.json());

// Define Mongoose Schema and Model
const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /todos — get all todos
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /todos — create a new todo
app.post("/todos", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "A non-empty title is required" });
    }
    const todo = new Todo({ title: title.trim() });
    const saved = await todo.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /todos/:id — get a single todo by id
app.get("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ error: "Todo not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// PUT /todos/:id — update a single todo by id
app.put("/todos/:id", async (req, res) => {
  try {
    const { title, completed } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Invalid title" });
      }
      updates.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "Invalid completed value" });
      }
      updates.completed = completed;
    }

    const updated = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Todo not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// DELETE /todos/:id — delete a single todo by id
app.delete("/todos/:id", async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Todo not found" });
    res.json({ message: "Todo deleted successfully", todo: deleted });
  } catch (err) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Todo API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });

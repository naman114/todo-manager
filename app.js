const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// eslint-disable-next-line
app.get("/todos", (req, res) => {
  //   res.send("Hello world");
  console.log("Todo list");
});

app.post("/todos", async (req, res) => {
  console.log("Creating a todo", req.body);
  try {
    const { title, dueDate } = req.body;
    const todo = await Todo.addTodo({ title, dueDate, completed: false });
    return res.json(todo);
  } catch (error) {
    console.error(error);
    // Unprocessable entity
    return res.status(422).json({ error });
  }
});

app.put("/todos/:id/markAsCompleted", async (req, res) => {
  console.log("Update todo with id:", req.params.id);
  try {
    const todo = await Todo.findByPk(req.params.id);
    const updatedTodo = await todo.markAsCompleted();
    return res.json(updatedTodo);
  } catch (error) {
    console.error(error);
    // Unprocessable entity
    return res.status(422).json({ error });
  }
});

// eslint-disable-next-line
app.delete("/todos/:id", (req, res) => {
  console.log("Delete todo with id:", req.params.id);
});

module.exports = app;

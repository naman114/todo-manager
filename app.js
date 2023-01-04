const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Todo } = require("./models");

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("some secret string"));
app.use(csurf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  const overdueTodos = await Todo.overdue();
  const dueTodayTodos = await Todo.dueToday();
  const dueLaterTodos = await Todo.dueLater();
  const completedTodos = await Todo.completedItems();
  if (request.accepts("html")) {
    response.set("Cache-Control", "no-store");
    response.render("index", {
      overdueTodos,
      dueTodayTodos,
      dueLaterTodos,
      completedTodos,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ overdueTodos, dueTodayTodos, dueLaterTodos });
  }
});

app.get("/todos", async function (request, response) {
  console.log("Processing list of all Todos ...");
  const todos = await Todo.findAll();
  return response.send(todos);
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    if (request.accepts("html")) {
      return response.redirect("/");
    } else {
      return response.json(todo);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  const { completed } = request.body;
  try {
    const updatedTodo = await todo.setCompletionStatus(completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    const todoId = Number(request.params.id);

    const doesTodoExist = await Todo.findByPk(todoId);

    if (!todoId || doesTodoExist === null) {
      return response.status(404).send(false);
    } else {
      await Todo.remove(todoId);
      return response.send(true);
    }
  } catch (error) {
    console.log(error);
    return response.status(422).send(false);
  }
});

module.exports = app;

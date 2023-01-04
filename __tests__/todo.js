const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCSRFToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    const csrfToken = extractCSRFToken(await agent.get("/"));
    let response = await agent.get("/todos");
    let parsedResponse = JSON.parse(response.text);
    const currentTodoCount = parsedResponse.length;

    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    response = await agent.get("/todos");
    parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(currentTodoCount + 1);
    expect(parsedResponse[0]["title"]).toBe("Buy ps3");
  });

  test("Fetches a specific todo from the database by id using /todos/:id endpoint", async () => {
    const csrfToken = extractCSRFToken(await agent.get("/"));

    let response = await agent
      .post("/todos")
      .send({
        title: "Water the plants",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      })
      .set("Accept", "application/json");
    let parsedResponse = JSON.parse(response.text);

    response = await agent.get(`/todos/${parsedResponse.id}`);
    parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.title).toBe("Water the plants");
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get("/");
    const csrfToken = extractCSRFToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Sets the completion status of a todo with the given ID", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ completed: true, _csrf: csrfToken });

    let parsedUpdatedResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdatedResponse.completed).toBe(true);

    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);

    const markIncompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ completed: false, _csrf: csrfToken });

    parsedUpdatedResponse = JSON.parse(markIncompleteResponse.text);
    expect(parsedUpdatedResponse.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res);

    const todo = await agent
      .post("/todos")
      .send({
        title: "Buy xbox",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      })
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(todo.text);

    csrfToken = extractCSRFToken(await agent.get("/"));
    let response = await agent
      .delete(`/todos/${parsedResponse.id}`)
      .send({ _csrf: csrfToken });
    expect(response.text).toBe("true");

    const invalidTodoID = Number(parsedResponse.id) + 1;
    csrfToken = extractCSRFToken(await agent.get("/"));
    response = await agent
      .delete(`/todos/${invalidTodoID}`)
      .send({ _csrf: csrfToken });
    expect(response.statusCode).toBe(404);
    expect(response.text).toBe("false");
  });
});

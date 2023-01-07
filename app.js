const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const { Todo, User } = require("./models");
const generateSequelizeErrorMessage = require("./utils/generateErrorMessage");

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("some secret string"));
app.use(csurf("123456789iamasecret987654321look", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "my-super-secret-key-156255378292938374",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async function (request, response) {
  response.render("index", {
    title: "Todo application",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (err) {
    console.log(JSON.stringify(err));
    const errorMessages =
      err.name === "SequelizeValidationError" &&
      err.errors.map((sequelizeValidationError) =>
        generateSequelizeErrorMessage(
          sequelizeValidationError.path,
          sequelizeValidationError.validatorKey
        )
      );
    request.flash("error", errorMessages);
    response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  }
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    } else {
      response.redirect("/");
    }
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const loggedInUser = request.user.id;
    const overdueTodos = await Todo.overdue(loggedInUser);
    const dueTodayTodos = await Todo.dueToday(loggedInUser);
    const dueLaterTodos = await Todo.dueLater(loggedInUser);
    const completedTodos = await Todo.completedItems(loggedInUser);
    if (request.accepts("html")) {
      response.set("Cache-Control", "no-store");
      response.render("todo", {
        title: "Todo Manager",
        overdueTodos,
        dueTodayTodos,
        dueLaterTodos,
        completedTodos,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({ overdueTodos, dueTodayTodos, dueLaterTodos });
    }
  }
);

app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const { title, dueDate } = request.body;
    console.log(request.user);
    try {
      const todo = await Todo.addTodo({
        title,
        dueDate,
        userId: request.user.id,
      });
      if (request.accepts("html")) {
        return response.redirect("/todos");
      } else {
        return response.json(todo);
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    const { completed } = request.body;
    try {
      const updatedTodo = await todo.setCompletionStatus(
        completed,
        request.user.id
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    try {
      const loggedInUser = request.user.id;
      const todoId = Number(request.params.id);

      const doesTodoExist = await Todo.findByPk(todoId);

      if (!todoId || doesTodoExist === null) {
        return response.status(404).send(false);
      } else {
        await Todo.remove(todoId, loggedInUser);
        return response.send(true);
      }
    } catch (error) {
      console.log(error);
      return response.status(422).send(false);
    }
  }
);

module.exports = app;

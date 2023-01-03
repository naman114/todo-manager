"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title, dueDate, completed: false });
    }

    static getTodos() {
      return this.findAll();
    }

    static async overdue() {
      try {
        let todos = await Todo.findAll({});

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        todos = todos.filter((todo) => {
          const dueDate = new Date(todo.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return now.valueOf() > dueDate.valueOf();
        });

        return todos;
      } catch (error) {
        console.error(error);
      }
    }

    static async dueToday() {
      try {
        let todos = await Todo.findAll({});

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        todos = todos.filter((todo) => {
          const dueDate = new Date(todo.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return now.valueOf() === dueDate.valueOf();
        });

        return todos;
      } catch (error) {
        console.error(error);
      }
    }

    static async dueLater() {
      try {
        let todos = await Todo.findAll({});

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        todos = todos.filter((todo) => {
          const dueDate = new Date(todo.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return now.valueOf() < dueDate.valueOf();
        });

        return todos;
      } catch (error) {
        console.error(error);
      }
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};

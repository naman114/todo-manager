"use strict";
const { Model, Op } = require("sequelize");
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

    static async overdue() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          completed: false,
        },
        order: [["createdAt", "ASC"]],
      });
    }

    static async dueToday() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          completed: false,
        },
        order: [["createdAt", "ASC"]],
      });
    }

    static async dueLater() {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: false,
        },
        order: [["createdAt", "ASC"]],
      });
    }

    static async completedItems() {
      return this.findAll({
        where: {
          completed: true,
        },
        order: [["createdAt", "ASC"]],
      });
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    setCompletionStatus(completionStatus) {
      return this.update({ completed: completionStatus });
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

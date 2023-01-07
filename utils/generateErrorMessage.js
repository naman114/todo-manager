const generateSequelizeErrorMessage = (field, errorType) => {
  switch (errorType) {
    case "notEmpty":
      return `Field ${field} cannot be empty`;
    case "isEmail":
      return `Please enter a valid email`;
    default:
      return `Please enter a valid value for field ${field}`;
  }
};

module.exports = generateSequelizeErrorMessage;

const generateSequelizeErrorMessage = (field, errorType, args = {}) => {
  switch (errorType) {
    case "notEmpty":
      return `Field ${field} cannot be empty`;
    case "isEmail":
      return `Please enter a valid email`;
    case "len":
      return `Field ${field} should have minimum length of ${args.minLength}`;
    case "isDate":
      return `Please enter a valid date for field ${field}`;
    case "not_unique":
      return `Record with same ${field} already exists`;
    default:
      return `Validation error`;
  }
};

module.exports = generateSequelizeErrorMessage;

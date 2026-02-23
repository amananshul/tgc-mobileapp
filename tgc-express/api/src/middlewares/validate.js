// Generic zod validation middleware
// Usage: router.post("/register", validate(registerSchema), controller.register)
function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error); // caught by error.middleware.js
    }
    req.body = result.data; // use parsed/transformed data
    return next();
  };
}

function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(result.error);
    }
    req.query = result.data;
    return next();
  };
}

module.exports = validate;
module.exports.validateQuery = validateQuery;

const { ZodError } = require("zod");
const env = require("../config/env");

// Central error-handling middleware — must have 4 params so Express treats it as error handler
function errorMiddleware(err, _req, res, _next) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({ message: "Validation error", errors });
  }

  // Application errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Fallback
  console.error("[ERROR]", err);
  return res.status(500).json({
    message: "Internal server error",
    ...(env.isDev && { error: err.message }),
  });
}

module.exports = errorMiddleware;

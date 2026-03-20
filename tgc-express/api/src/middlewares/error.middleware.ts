import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import env from "../config/env";

interface AppError extends Error {
  statusCode?: number;
}

// Central error-handling middleware — must have 4 params so Express treats it as error handler
function errorMiddleware(err: AppError | ZodError | Error, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({ message: "Validation error", errors });
    return;
  }

  // Application errors with statusCode
  const appErr = err as AppError;
  if (appErr.statusCode) {
    res.status(appErr.statusCode).json({ message: appErr.message });
    return;
  }

  // Fallback
  console.error("[ERROR]", err);
  res.status(500).json({
    message: "Internal server error",
    ...(env.isDev && { error: err.message }),
  });
}

export default errorMiddleware;

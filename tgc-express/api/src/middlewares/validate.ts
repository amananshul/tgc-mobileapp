import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Generic zod validation middleware
// Usage: router.post("/register", validate(registerSchema), controller.register)
function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error); // caught by error.middleware.ts
    }
    req.body = result.data; // use parsed/transformed data
    return next();
  };
}

function validateQuery(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(result.error);
    }
    req.query = result.data as Record<string, string>;
    return next();
  };
}

export { validate, validateQuery };
export default validate;

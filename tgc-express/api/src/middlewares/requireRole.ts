import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/prisma";

function requireRole(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });
      if (!user || !allowedRoles.includes(user.role)) {
        const err = Object.assign(new Error("Forbidden: insufficient role"), { statusCode: 403 });
        return next(err);
      }
      req.user.role = user.role;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export default requireRole;

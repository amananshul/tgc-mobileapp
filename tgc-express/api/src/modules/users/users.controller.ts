import { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service";

async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.getUserById(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { getMe };

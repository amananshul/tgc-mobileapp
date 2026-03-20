import { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service";

async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await dashboardService.getDashboard(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { getDashboard };

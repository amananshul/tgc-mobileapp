import { Request, Response, NextFunction } from "express";
import * as profileService from "./profile.service";

async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.updateProfile(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.saveOnboarding(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { updateProfile, updateOnboarding };

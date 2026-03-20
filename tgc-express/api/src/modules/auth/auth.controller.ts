import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.resendOtp(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.refreshTokens(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.logoutUser({
      userId: req.user.userId,
      refreshToken: req.body.refreshToken,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { register, login, verifyOtp, resendOtp, refresh, logout };

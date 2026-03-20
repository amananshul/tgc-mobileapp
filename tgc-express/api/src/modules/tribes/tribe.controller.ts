import { Request, Response, NextFunction } from "express";
import * as tribeService from "./tribe.service";

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.createTribe(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.listTribes(req.user.userId, req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.getTribeBySlug(
      req.params.slug,
      req.user.userId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function join(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.joinTribe(
      req.user.userId,
      req.params.tribeId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function leave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.leaveTribe(
      req.user.userId,
      req.params.tribeId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function myTribes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.getMyTribes(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribeService.updateTribe(
      req.user.userId,
      req.params.tribeId,
      req.body
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { create, list, getBySlug, join, leave, myTribes, update };

import { Request, Response, NextFunction } from "express";
import * as tribePostService from "./tribePost.service";

async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribePostService.listTribePosts(
      req.params.tribeId,
      req.user.userId
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tribePostService.createTribePost(
      req.params.tribeId,
      req.user.userId,
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export { list, create };

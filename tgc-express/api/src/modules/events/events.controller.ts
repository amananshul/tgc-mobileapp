import { Request, Response, NextFunction } from "express";
import * as eventsService from "./events.service";

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.createEvent(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.listEvents(req.user.userId, req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.getEventBySlug(req.user.userId, req.params.slug);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.registerForEvent(req.user.userId, req.params.eventId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function unregister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.unregisterFromEvent(req.user.userId, req.params.eventId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function myEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.getMyEvents(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.updateEvent(req.user.userId, req.params.eventId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.deleteEvent(req.user.userId, req.params.eventId, req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export { create, list, getBySlug, register, unregister, myEvents, update, remove };

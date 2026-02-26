const eventsService = require("./events.service");

async function create(req, res, next) {
  try {
    const result = await eventsService.createEvent(req.user.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await eventsService.listEvents(req.user.userId, req.query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const result = await eventsService.getEventBySlug(req.user.userId, req.params.slug);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const result = await eventsService.registerForEvent(req.user.userId, req.params.eventId);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function unregister(req, res, next) {
  try {
    const result = await eventsService.unregisterFromEvent(req.user.userId, req.params.eventId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function myEvents(req, res, next) {
  try {
    const result = await eventsService.getMyEvents(req.user.userId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await eventsService.updateEvent(req.user.userId, req.params.eventId, req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await eventsService.deleteEvent(req.user.userId, req.params.eventId, req.user.role);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getBySlug, register, unregister, myEvents, update, remove };

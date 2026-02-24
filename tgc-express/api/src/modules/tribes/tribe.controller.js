const tribeService = require("./tribe.service");

async function create(req, res, next) {
  try {
    const result = await tribeService.createTribe(req.user.userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await tribeService.listTribes(req.user.userId, req.query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const result = await tribeService.getTribeBySlug(
      req.params.slug,
      req.user.userId
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function join(req, res, next) {
  try {
    const result = await tribeService.joinTribe(
      req.user.userId,
      req.params.tribeId
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function leave(req, res, next) {
  try {
    const result = await tribeService.leaveTribe(
      req.user.userId,
      req.params.tribeId
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function myTribes(req, res, next) {
  try {
    const result = await tribeService.getMyTribes(req.user.userId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await tribeService.updateTribe(
      req.user.userId,
      req.params.tribeId,
      req.body
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getBySlug, join, leave, myTribes, update };

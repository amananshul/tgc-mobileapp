const tribePostService = require("./tribePost.service");

async function list(req, res, next) {
  try {
    const result = await tribePostService.listTribePosts(
      req.params.tribeId,
      req.user.userId
    );
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const result = await tribePostService.createTribePost(
      req.params.tribeId,
      req.user.userId,
      req.body
    );
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create };

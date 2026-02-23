const usersService = require("./users.service");

async function getMe(req, res, next) {
  try {
    const result = await usersService.getUserById(req.user.userId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe };

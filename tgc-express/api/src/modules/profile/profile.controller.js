const profileService = require("./profile.service");

async function updateProfile(req, res, next) {
  try {
    const result = await profileService.updateProfile(req.user.userId, req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function updateOnboarding(req, res, next) {
  try {
    const result = await profileService.saveOnboarding(req.user.userId, req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { updateProfile, updateOnboarding };

const dashboardService = require("./dashboard.service");

async function getDashboard(req, res, next) {
  try {
    const result = await dashboardService.getDashboard(req.user.userId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getDashboard };

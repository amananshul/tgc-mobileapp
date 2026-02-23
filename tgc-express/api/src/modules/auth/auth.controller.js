const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyOtp(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const result = await authService.resendOtp(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshTokens(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logoutUser({
      userId: req.user.userId,
      refreshToken: req.body.refreshToken,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, verifyOtp, resendOtp, refresh, logout };

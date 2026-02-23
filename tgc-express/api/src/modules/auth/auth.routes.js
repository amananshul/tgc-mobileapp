const { Router } = require("express");
const controller = require("./auth.controller");
const validate = require("../../middlewares/validate");
const { authLimiter } = require("../../middlewares/rateLimit");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
} = require("./auth.schema");

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), controller.register);
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/verify-otp", validate(verifyOtpSchema), controller.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), controller.resendOtp);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", authMiddleware, controller.logout);

module.exports = router;

import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { authLimiter } from "../../middlewares/rateLimit";
import authMiddleware from "../../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshSchema,
} from "./auth.schema";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), controller.register);
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/verify-otp", validate(verifyOtpSchema), controller.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), controller.resendOtp);
router.post("/refresh", validate(refreshSchema), controller.refresh);
router.post("/logout", authMiddleware, controller.logout);

export default router;

import { Router } from "express";
import * as controller from "./profile.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { updateProfileSchema, updateOnboardingSchema } from "./profile.schema";

const router = Router();

router.patch(
  "/onboarding",
  authMiddleware,
  validate(updateOnboardingSchema),
  controller.updateOnboarding
);
router.patch("/", authMiddleware, validate(updateProfileSchema), controller.updateProfile);

export default router;

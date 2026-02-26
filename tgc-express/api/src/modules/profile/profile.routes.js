const { Router } = require("express");
const controller = require("./profile.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { updateProfileSchema, updateOnboardingSchema } = require("./profile.schema");

const router = Router();

router.patch(
  "/onboarding",
  authMiddleware,
  validate(updateOnboardingSchema),
  controller.updateOnboarding
);
router.patch("/", authMiddleware, validate(updateProfileSchema), controller.updateProfile);

module.exports = router;

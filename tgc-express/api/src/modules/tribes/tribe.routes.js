const { Router } = require("express");
const controller = require("./tribe.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { validateQuery } = require("../../middlewares/validate");
const requireRole = require("../../middlewares/requireRole");
const { createTribeSchema, listTribesSchema } = require("./tribe.schema");

const router = Router();

// All tribe routes require authentication
router.use(authMiddleware);

router.post(
  "/",
  requireRole("HOST", "ADMIN"),
  validate(createTribeSchema),
  controller.create
);
router.get("/", validateQuery(listTribesSchema), controller.list);
router.get("/my", controller.myTribes);
router.get("/:slug", controller.getBySlug);
router.post("/:tribeId/join", controller.join);
router.delete("/:tribeId/leave", controller.leave);

module.exports = router;

const { Router } = require("express");
const controller = require("./events.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { validateQuery } = require("../../middlewares/validate");
const requireRole = require("../../middlewares/requireRole");
const { createEventSchema, updateEventSchema, listEventsQuerySchema } = require("./events.schema");

const router = Router();

router.use(authMiddleware);

router.get("/", validateQuery(listEventsQuerySchema), controller.list);
router.get("/my", controller.myEvents);
router.get("/:slug", controller.getBySlug);

router.post(
  "/",
  requireRole("HOST", "ADMIN"),
  validate(createEventSchema),
  controller.create
);

router.patch(
  "/:eventId",
  requireRole("HOST", "ADMIN"),
  validate(updateEventSchema),
  controller.update
);

router.delete("/:eventId", requireRole("HOST", "ADMIN"), controller.remove);

router.post("/:eventId/register", controller.register);
router.delete("/:eventId/register", controller.unregister);

module.exports = router;

import { Router } from "express";
import * as controller from "./events.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate, validateQuery } from "../../middlewares/validate";
import requireRole from "../../middlewares/requireRole";
import { createEventSchema, updateEventSchema, listEventsQuerySchema } from "./events.schema";

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

export default router;

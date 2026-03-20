import { Router } from "express";
import * as controller from "./tribe.controller";
import * as tribePostController from "./tribePost.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate, validateQuery } from "../../middlewares/validate";
import requireRole from "../../middlewares/requireRole";
import { createTribeSchema, listTribesSchema, updateTribeSchema } from "./tribe.schema";
import { createTribePostSchema } from "./tribePost.schema";

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
router.patch("/:tribeId", validate(updateTribeSchema), controller.update);
router.get("/:tribeId/posts", tribePostController.list);
router.post("/:tribeId/posts", validate(createTribePostSchema), tribePostController.create);
router.get("/:slug", controller.getBySlug);
router.post("/:tribeId/join", controller.join);
router.delete("/:tribeId/leave", controller.leave);

export default router;

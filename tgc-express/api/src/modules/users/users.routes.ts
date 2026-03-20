import { Router } from "express";
import * as controller from "./users.controller";
import authMiddleware from "../../middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, controller.getMe);

export default router;

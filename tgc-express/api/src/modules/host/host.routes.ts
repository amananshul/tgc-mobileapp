import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import * as controller from "./host.controller";

const router = Router();

router.post("/enable", authMiddleware, controller.enable);

export default router;

import { Router } from "express";
import * as controller from "./dashboard.controller";
import authMiddleware from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, controller.getDashboard);

export default router;

import { Router } from "express";
import * as controller from "./upload.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate, validateQuery } from "../../middlewares/validate";
import { presignUploadSchema, viewUrlQuerySchema } from "./uploads.schema";

const router = Router();

router.use(authMiddleware);

router.post("/presign", validate(presignUploadSchema), controller.presign);
router.get("/view-url", validateQuery(viewUrlQuerySchema), controller.getViewUrl);

export default router;

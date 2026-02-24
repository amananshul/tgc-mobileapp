const { Router } = require("express");
const controller = require("./upload.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate");
const { validateQuery } = require("../../middlewares/validate");
const { presignUploadSchema, viewUrlQuerySchema } = require("./uploads.schema");

const router = Router();

router.use(authMiddleware);

router.post("/presign", validate(presignUploadSchema), controller.presign);
router.get("/view-url", validateQuery(viewUrlQuerySchema), controller.getViewUrl);

module.exports = router;

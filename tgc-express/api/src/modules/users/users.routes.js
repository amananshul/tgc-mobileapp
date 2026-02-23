const { Router } = require("express");
const controller = require("./users.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = Router();

router.get("/me", authMiddleware, controller.getMe);

module.exports = router;

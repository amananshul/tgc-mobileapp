const { Router } = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const controller = require("./host.controller");

const router = Router();

router.post("/enable", authMiddleware, controller.enable);

module.exports = router;

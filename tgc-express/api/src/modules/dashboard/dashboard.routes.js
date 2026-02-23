const { Router } = require("express");
const controller = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = Router();

router.get("/", authMiddleware, controller.getDashboard);

module.exports = router;

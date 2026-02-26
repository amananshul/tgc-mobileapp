const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Route modules
const usersRoutes = require("./modules/users/users.routes");
const profileRoutes = require("./modules/profile/profile.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const tribesRoutes = require("./modules/tribes/tribe.routes");
const uploadsRoutes = require("./modules/uploads/uploads.routes");
const hostRoutes = require("./modules/host/host.routes");
const eventsRoutes = require("./modules/events/events.routes");

// Middleware
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/users", usersRoutes);
app.use("/profile", profileRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tribes", tribesRoutes);
app.use("/uploads", uploadsRoutes);
app.use("/host", hostRoutes);
app.use("/events", eventsRoutes);

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;

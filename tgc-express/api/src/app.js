const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

// Route modules
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const profileRoutes = require("./modules/profile/profile.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const tribesRoutes = require("./modules/tribes/tribe.routes");
const uploadsRoutes = require("./modules/uploads/uploads.routes");

// Middleware
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();
const uploadsRoot = path.join(process.cwd(), "uploads");
fs.mkdirSync(path.join(uploadsRoot, "avatars"), { recursive: true });

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());
app.use("/media", express.static(uploadsRoot));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/profile", profileRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tribes", tribesRoutes);
app.use("/uploads", uploadsRoutes);

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;

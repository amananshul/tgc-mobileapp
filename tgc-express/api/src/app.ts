import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Route modules
import usersRoutes from "./modules/users/users.routes";
import profileRoutes from "./modules/profile/profile.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import tribesRoutes from "./modules/tribes/tribe.routes";
import uploadsRoutes from "./modules/uploads/uploads.routes";
import hostRoutes from "./modules/host/host.routes";
import eventsRoutes from "./modules/events/events.routes";

// Middleware
import errorMiddleware from "./middlewares/error.middleware";

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

export default app;

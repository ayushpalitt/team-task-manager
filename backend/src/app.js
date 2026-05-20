import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import activityRoutes from "./routes/activity.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import userRoutes from "./routes/user.routes.js";

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (env.clientUrls.includes(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith(".vercel.app") && env.clientUrls.some((url) => url.includes(".vercel.app"));
  } catch (_error) {
    return false;
  }
};

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  const corsOptions = {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  };
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "team-task-manager-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/activity", activityRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

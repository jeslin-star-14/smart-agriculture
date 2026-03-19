import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import createRoutes from "./routes/index.js";

export default function createApp(io) {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api", createRoutes(io));

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend server is running" });
  });

  // Error handling
  app.use(errorHandler);

  return app;
}
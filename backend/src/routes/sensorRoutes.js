// backend/src/routes/sensorRoutes.js
import express from "express";
import {
  getLatest,
  getHistory,
  getStats,
  clearAll,
} from "../controllers/sensorController.js";

const router = express.Router();

// GET  /api/sensor/latest       → most recent single reading
router.get("/latest",  getLatest);

// GET  /api/sensor/history      → last N readings (default 100, last 24h)
// GET  /api/sensor/history?limit=50&hours=6
router.get("/history", getHistory);

// GET  /api/sensor/stats        → min/max/avg summary
// GET  /api/sensor/stats?hours=48
router.get("/stats",   getStats);

// DELETE /api/sensor/clear      → wipe all data (testing only)
router.delete("/clear", clearAll);

export default router;
// backend/src/routes/sensorRoutes.js
// REPLACE your existing sensorRoutes.js

const express = require("express");
const router  = express.Router();
const {
  getLatest,
  getHistory,
  getStats,
  clearAll,
} = require("../controllers/sensorController");

// GET  /api/sensors/latest       → most recent single reading
router.get("/latest",  getLatest);

// GET  /api/sensors/history      → last N readings (default 100, last 24h)
// GET  /api/sensors/history?limit=50&hours=6
router.get("/history", getHistory);

// GET  /api/sensors/stats        → min/max/avg summary
// GET  /api/sensors/stats?hours=48
router.get("/stats",   getStats);

// DELETE /api/sensors/clear      → wipe all data (testing only)
router.delete("/clear", clearAll);

module.exports = router;
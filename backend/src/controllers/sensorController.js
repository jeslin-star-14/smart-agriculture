// backend/src/controllers/sensorController.js
// API endpoints to READ the saved sensor data from MongoDB

import SensorData from "../models/SensorData.js";

// ── GET /api/sensors/latest ────────────────────────────────────
// Returns the single most recent reading
export const getLatest = async (req, res) => {
  try {
    const latest = await SensorData
      .findOne()
      .sort({ createdAt: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({ message: "No sensor data found yet" });
    }

    res.json({ success: true, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sensors/history?limit=100&hours=24 ───────────────
// Returns recent readings for charts / history view
export const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const hours = parseInt(req.query.hours) || 24;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const data = await SensorData
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: data.length,
      hours,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/sensors/stats ────────────────────────────────────
// Returns min/max/avg for each sensor over last 24 hours
export const getStats = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await SensorData.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          totalReadings:   { $sum: 1 },
          avgTemperature:  { $avg: "$temperature" },
          minTemperature:  { $min: "$temperature" },
          maxTemperature:  { $max: "$temperature" },
          avgHumidity:     { $avg: "$humidity" },
          minHumidity:     { $min: "$humidity" },
          maxHumidity:     { $max: "$humidity" },
          avgSoilMoisture: { $avg: "$soilMoisture" },
          minSoilMoisture: { $min: "$soilMoisture" },
          maxSoilMoisture: { $max: "$soilMoisture" },
          avgLight:        { $avg: "$light" },
          avgPh:           { $avg: "$ph" },
          rainCount:       { $sum: "$rain" },
        },
      },
    ]);

    const result = stats[0] || {};

    // Round to 2 decimal places
    Object.keys(result).forEach(k => {
      if (typeof result[k] === "number") {
        result[k] = Math.round(result[k] * 100) / 100;
      }
    });

    res.json({ success: true, hours, stats: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/sensors/clear ─────────────────────────────────
// Clear all sensor data (for testing/reset)
export const clearAll = async (req, res) => {
  try {
    const result = await SensorData.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
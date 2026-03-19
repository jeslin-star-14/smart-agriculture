// backend/src/models/SensorData.js
// This model saves every Arduino sensor reading into MongoDB automatically.
// Each document stores all sensor values + timestamp.

import mongoose from "mongoose";

const SensorDataSchema = new mongoose.Schema(
  {
    // ── Sensor Readings ──────────────────────────────────────
    temperature: {
      type: Number,
      default: null,
      comment: "°C from DHT22",
    },
    humidity: {
      type: Number,
      default: null,
      comment: "% RH from DHT22",
    },
    soilMoisture: {
      type: Number,
      default: null,
      comment: "0-100% from analog soil sensor",
    },
    light: {
      type: Number,
      default: null,
      comment: "0-1000 lux from LDR",
    },
    ph: {
      type: Number,
      default: null,
      comment: "0-14 pH scale from analog sensor",
    },
    rain: {
      type: Number,
      default: null,
      comment: "0 = dry, 1 = rain detected",
    },

    // ── Meta ─────────────────────────────────────────────────
    deviceId: {
      type: String,
      default: "arduino-uno-01",
      comment: "Which Arduino board sent this",
    },
    status: {
      type: String,
      enum: ["ok", "error", "warning"],
      default: "ok",
    },
  },
  {
    // Auto-adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Index for fast time-based queries (latest readings, history, charts)
SensorDataSchema.index({ createdAt: -1 });
SensorDataSchema.index({ deviceId: 1, createdAt: -1 });

export default mongoose.model("SensorData", SensorDataSchema);
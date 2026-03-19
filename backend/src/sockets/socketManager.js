// backend/src/sockets/socketManager.js
// This file handles Socket.io connections from the frontend
// It listens for Arduino sensor data and broadcasts it to connected clients

import SensorData from "../models/SensorData.js";
import logger from "../utils/logger.js";

// ── Config (set in backend/.env) ──────────────────────────────
const DEVICE_ID = process.env.DEVICE_ID || "arduino-uno-01";

let ioInstance = null;
let arduinoConnected = false;

// ── Setup Socket.io handlers ──────────────────────────────────
export function setupSocketManager(io) {
  ioInstance = io;

  ioInstance.on("connection", (socket) => {
    logger.info(`Frontend client connected: ${socket.id}`);

    // Send current Arduino status immediately when browser connects
    socket.emit("arduino_status", {
      connected: arduinoConnected,
      device: DEVICE_ID,
    });

    socket.on("check_arduino", () => {
      socket.emit("arduino_status", { 
        connected: arduinoConnected, 
        device: DEVICE_ID 
      });
    });

    socket.on("disconnect", () => {
      logger.info(`Frontend client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}
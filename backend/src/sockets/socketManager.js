// backend/src/sockets/socketManager.js
// REPLACE your existing socketManager.js with this file
//
// This file does TWO things:
//   1. Reads data from Arduino via USB Serial port (serialport npm package)
//   2. Broadcasts live sensor data to all connected React clients via Socket.io

const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const logger = require("../utils/logger");

// ── Configuration ─────────────────────────────────────────────
// Change ARDUINO_PORT to match your system:
//   Mac/Linux:  /dev/tty.usbmodem* or /dev/ttyACM0 or /dev/ttyUSB0
//   Windows:    COM3, COM4, COM5 etc.
// 
// TIP: In Arduino IDE → Tools → Port — copy the port name shown there
const ARDUINO_PORT = process.env.ARDUINO_PORT || "/dev/tty.usbmodem1101";
const BAUD_RATE    = parseInt(process.env.BAUD_RATE) || 9600;

let serialPort = null;
let ioInstance  = null;
let arduinoConnected = false;
let retryTimer = null;

// ── Initialize Socket.io + Serial ─────────────────────────────
function initSocketManager(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Handle browser WebSocket connections
  ioInstance.on("connection", (socket) => {
    logger.info(`Frontend client connected: ${socket.id}`);

    // Send current Arduino connection status immediately on connect
    socket.emit("arduino_status", {
      connected: arduinoConnected,
      port: ARDUINO_PORT,
    });

    socket.on("disconnect", () => {
      logger.info(`Frontend client disconnected: ${socket.id}`);
    });
  });

  // Start trying to connect to Arduino
  connectArduino();

  return ioInstance;
}

// ── Connect to Arduino Serial Port ────────────────────────────
function connectArduino() {
  logger.info(`Attempting Arduino connection on ${ARDUINO_PORT} at ${BAUD_RATE} baud...`);

  try {
    serialPort = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: BAUD_RATE,
      autoOpen: true,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    // ── Serial port opened successfully ──
    serialPort.on("open", () => {
      arduinoConnected = true;
      logger.info(`✓ Arduino connected on ${ARDUINO_PORT}`);

      // Tell all frontend clients Arduino is connected
      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: true, port: ARDUINO_PORT });
      }
    });

    // ── Parse each line of JSON from Arduino ──
    parser.on("data", (line) => {
      line = line.trim();
      if (!line) return;

      logger.debug(`Serial RX: ${line}`);

      try {
        const data = JSON.parse(line);

        // Skip status/error messages
        if (data.status || data.error) {
          logger.info(`Arduino: ${line}`);
          return;
        }

        // Build normalized sensor payload
        const payload = {
          temperature:  data.temp  !== undefined ? parseFloat(data.temp)  : null,
          humidity:     data.hum   !== undefined ? parseFloat(data.hum)   : null,
          soilMoisture: data.soil  !== undefined ? parseFloat(data.soil)  : null,
          light:        data.light !== undefined ? parseFloat(data.light) : null,
          ph:           data.ph    !== undefined ? parseFloat(data.ph)    : null,
          rain:         data.rain  !== undefined ? parseInt(data.rain)    : null,
          timestamp:    new Date().toISOString(),
        };

        // Broadcast to all connected React clients
        if (ioInstance) {
          ioInstance.emit("sensor_data", payload);
        }

      } catch (e) {
        // Non-JSON line (debug print from Arduino) — log but don't crash
        logger.debug(`Non-JSON serial data: ${line}`);
      }
    });

    // ── Serial port error ──
    serialPort.on("error", (err) => {
      arduinoConnected = false;
      logger.error(`Serial error: ${err.message}`);

      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: false, error: err.message });
      }

      scheduleRetry();
    });

    // ── Serial port closed ──
    serialPort.on("close", () => {
      arduinoConnected = false;
      logger.warn("Serial port closed. Will retry in 5s...");

      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: false });
      }

      scheduleRetry();
    });

  } catch (err) {
    arduinoConnected = false;
    logger.error(`Failed to open serial port: ${err.message}`);
    logger.warn(`Make sure Arduino is plugged in and port ${ARDUINO_PORT} is correct in .env`);
    scheduleRetry();
  }
}

// ── Retry connection every 5 seconds ──────────────────────────
function scheduleRetry() {
  if (retryTimer) return; // already scheduled
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (!arduinoConnected) connectArduino();
  }, 5000);
}

// ── List available serial ports (helper for debugging) ────────
async function listPorts() {
  try {
    const ports = await SerialPort.list();
    logger.info("Available serial ports:");
    ports.forEach(p => logger.info(`  ${p.path} — ${p.manufacturer || "unknown"}`));
    return ports;
  } catch (e) {
    logger.error("Could not list ports:", e.message);
    return [];
  }
}

module.exports = { initSocketManager, listPorts };
// backend/src/sockets/socketManager.js
// REPLACE your existing socketManager.js
//
// This file does THREE things:
//  1. Reads JSON sensor data from Arduino via USB Serial port
//  2. Saves every reading automatically to MongoDB (SensorData collection)
//  3. Broadcasts live data to React frontend via Socket.io WebSocket

const { Server }         = require("socket.io");
const { SerialPort }     = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const SensorData         = require("../models/SensorData");
const logger             = require("../utils/logger");

// ── Config (set in backend/.env) ──────────────────────────────
const ARDUINO_PORT = process.env.ARDUINO_PORT || "/dev/tty.usbmodem1101";
const BAUD_RATE    = parseInt(process.env.BAUD_RATE) || 9600;
const DEVICE_ID    = process.env.DEVICE_ID    || "arduino-uno-01";

// Save to DB every N readings (1 = save every reading)
// Increase to reduce DB writes e.g. 5 = save 1 out of every 5 readings
const SAVE_EVERY = parseInt(process.env.SAVE_EVERY) || 1;

let ioInstance       = null;
let arduinoConnected = false;
let retryTimer       = null;
let readingCount     = 0;

// ── Initialize ────────────────────────────────────────────────
function initSocketManager(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    logger.info(`Frontend client connected: ${socket.id}`);

    // Send current Arduino status immediately when browser connects
    socket.emit("arduino_status", {
      connected: arduinoConnected,
      port: ARDUINO_PORT,
    });

    socket.on("disconnect", () => {
      logger.info(`Frontend client disconnected: ${socket.id}`);
    });
  });

  connectArduino();
  return ioInstance;
}

// ── Connect to Arduino via Serial ─────────────────────────────
function connectArduino() {
  logger.info(`Connecting to Arduino on ${ARDUINO_PORT} @ ${BAUD_RATE} baud...`);

  try {
    const serialPort = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: BAUD_RATE,
      autoOpen: true,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    // ── Port opened ───────────────────────────────────────────
    serialPort.on("open", () => {
      arduinoConnected = true;
      logger.info(`✓ Arduino connected on ${ARDUINO_PORT}`);

      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: true, port: ARDUINO_PORT });
      }
    });

    // ── Incoming data line from Arduino ───────────────────────
    parser.on("data", async (line) => {
      line = line.trim();
      if (!line) return;

      logger.debug(`Serial RX: ${line}`);

      try {
        const raw = JSON.parse(line);

        // Skip status/error handshake messages
        if (raw.status || raw.error) {
          logger.info(`Arduino msg: ${line}`);
          return;
        }

        // ── Build normalized payload ──────────────────────────
        const payload = {
          temperature:  raw.temp  !== undefined ? parseFloat(raw.temp)  : null,
          humidity:     raw.hum   !== undefined ? parseFloat(raw.hum)   : null,
          soilMoisture: raw.soil  !== undefined ? parseFloat(raw.soil)  : null,
          light:        raw.light !== undefined ? parseFloat(raw.light) : null,
          ph:           raw.ph    !== undefined ? parseFloat(raw.ph)    : null,
          rain:         raw.rain  !== undefined ? parseInt(raw.rain)    : null,
          deviceId:     DEVICE_ID,
          status:       "ok",
        };

        // ── 1. Save to MongoDB ────────────────────────────────
        readingCount++;
        if (readingCount % SAVE_EVERY === 0) {
          await saveToDatabase(payload);
        }

        // ── 2. Broadcast to all React clients via Socket.io ───
        if (ioInstance) {
          ioInstance.emit("sensor_data", {
            ...payload,
            timestamp: new Date().toISOString(),
          });
        }

      } catch (e) {
        // Non-JSON line — Arduino debug print, ignore
        logger.debug(`Non-JSON serial: ${line}`);
      }
    });

    // ── Serial error ──────────────────────────────────────────
    serialPort.on("error", (err) => {
      arduinoConnected = false;
      logger.error(`Serial error: ${err.message}`);

      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: false, error: err.message });
      }
      scheduleRetry();
    });

    // ── Serial closed ─────────────────────────────────────────
    serialPort.on("close", () => {
      arduinoConnected = false;
      logger.warn("Serial port closed. Retrying in 5s...");

      if (ioInstance) {
        ioInstance.emit("arduino_status", { connected: false });
      }
      scheduleRetry();
    });

  } catch (err) {
    arduinoConnected = false;
    logger.error(`Cannot open serial port: ${err.message}`);
    logger.warn(`Check ARDUINO_PORT in .env — currently set to: ${ARDUINO_PORT}`);
    scheduleRetry();
  }
}

// ── Save sensor reading to MongoDB ────────────────────────────
async function saveToDatabase(payload) {
  try {
    const doc = new SensorData(payload);
    await doc.save();
    logger.info(
      `💾 Saved to MongoDB — ` +
      `T:${payload.temperature}°C | ` +
      `H:${payload.humidity}% | ` +
      `Soil:${payload.soilMoisture}% | ` +
      `Light:${payload.light}lux | ` +
      `pH:${payload.ph} | ` +
      `Rain:${payload.rain}`
    );
  } catch (err) {
    logger.error(`MongoDB save failed: ${err.message}`);
  }
}

// ── Retry connection every 5 seconds ──────────────────────────
function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (!arduinoConnected) connectArduino();
  }, 5000);
}

module.exports = { initSocketManager };
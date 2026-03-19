import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import createApp from "./app.js";
import { setupSocketManager } from "./sockets/socketManager.js";

dotenv.config();

connectDB();

// Create HTTP server
const httpServer = http.createServer();

// Create Socket.io instance
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Create Express app with Socket.io
const app = createApp(io);

// Attach Express app to HTTP server
httpServer.on("request", app);

// Setup Socket.io handlers
setupSocketManager(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
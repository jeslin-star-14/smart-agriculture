import http from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"

import connectDB from "./config/database.js"
import createApp from "./app.js"
import { initSocket } from "./sockets/socketManager.js"

dotenv.config()

connectDB()

const PORT = process.env.PORT || 5000

const httpServer = http.createServer()

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
})

const app = createApp(io)

httpServer.on("request", app)

initSocket(io)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
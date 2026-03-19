import express from "express"
import sensorRoutes from "./sensorRoutes.js"
import deviceRoutes from "./deviceRoutes.js"

export default (io) => {

  const router = express.Router()

  router.use("/sensor", sensorRoutes)
  router.use("/device", deviceRoutes)

  return router

}
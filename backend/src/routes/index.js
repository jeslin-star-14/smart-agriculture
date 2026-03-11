import express from "express"
import sensorRoutes from "./sensorRoutes.js"
import deviceRoutes from "./deviceRoutes.js"

const router = express.Router()

export default (io) => {

  router.use("/sensor", sensorRoutes(io))
  router.use("/device", deviceRoutes)

  return router

}
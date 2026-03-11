import express from "express"
import { receiveSensorData, getLatestData } from "../controllers/sensorController.js"

const router = express.Router()

export default (io) => {

  router.post("/", (req, res) => receiveSensorData(req, res, io))

  router.get("/latest", getLatestData)

  return router
}
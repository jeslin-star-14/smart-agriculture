import express from "express"
import { getDeviceStatus } from "../controllers/deviceController.js"

const router = express.Router()

router.get("/", getDeviceStatus)

export default router
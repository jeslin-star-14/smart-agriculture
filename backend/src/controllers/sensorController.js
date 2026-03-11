import SensorData from "../models/SensorData.js"
import DeviceStatus from "../models/DeviceStatus.js"

export const receiveSensorData = async (req, res, io) => {

  try {

    const { soil, temperature, humidity, light } = req.body

    const data = await SensorData.create({
      soil,
      temperature,
      humidity,
      light
    })

    await DeviceStatus.findOneAndUpdate(
      { deviceId: "farm_node" },
      { lastSeen: new Date() },
      { upsert: true }
    )

    io.emit("sensorData", data)

    res.json({ success: true })

  } catch (error) {

    res.status(500).json({ error: error.message })

  }

}

export const getLatestData = async (req, res) => {

  const data = await SensorData
    .find()
    .sort({ createdAt: -1 })
    .limit(1)

  res.json(data[0])

}
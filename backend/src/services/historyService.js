import SensorData from "../models/SensorData.js"

export const getSensorHistory = async () => {

  const history = await SensorData
    .find()
    .sort({ createdAt: -1 })
    .limit(50)

  return history

}
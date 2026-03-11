import DeviceStatus from "../models/DeviceStatus.js"

export const getDeviceStatus = async (req, res) => {

  const device = await DeviceStatus.findOne({ deviceId: "farm_node" })

  if (!device) {
    return res.json({ connected: false })
  }

  const diff = Date.now() - new Date(device.lastSeen).getTime()

  const connected = diff < 10000

  res.json({ connected })

}
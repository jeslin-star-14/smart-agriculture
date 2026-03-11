import DeviceStatus from "../models/DeviceStatus.js"

export const checkDeviceHeartbeat = async () => {

  const device = await DeviceStatus.findOne({ deviceId: "farm_node" })

  if (!device) return false

  const diff = Date.now() - new Date(device.lastSeen).getTime()

  return diff < 10000

}
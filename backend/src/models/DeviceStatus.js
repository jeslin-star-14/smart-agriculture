import mongoose from "mongoose"

const DeviceSchema = new mongoose.Schema({

  deviceId: String,

  lastSeen: {
    type: Date,
    default: Date.now
  }

})

export default mongoose.model("DeviceStatus", DeviceSchema)
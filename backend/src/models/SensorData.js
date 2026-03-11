import mongoose from "mongoose"

const SensorSchema = new mongoose.Schema({

  soil: Number,
  temperature: Number,
  humidity: Number,
  light: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }

})

export default mongoose.model("SensorData", SensorSchema)
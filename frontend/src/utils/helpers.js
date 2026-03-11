// Format sensor value safely
export const formatValue = (value, unit = "") => {
  if (value === null || value === undefined) {
    return `-- ${unit}`
  }

  return `${value} ${unit}`
}


// Convert timestamp to readable time
export const formatTime = (timestamp) => {

  if (!timestamp) return "--"

  const date = new Date(timestamp)

  return date.toLocaleTimeString()
}


// Check if device is still connected
export const isDeviceOnline = (lastSeen, timeout = 10000) => {

  if (!lastSeen) return false

  const now = new Date().getTime()

  return now - lastSeen < timeout
}


// Generate alerts based on sensor values
export const generateAlert = (data) => {

  if (!data) return null

  if (data.soil < 30) {
    return "⚠ Soil moisture is very low. Irrigation required."
  }

  if (data.temperature > 40) {
    return "⚠ Temperature is too high."
  }

  if (data.humidity < 20) {
    return "⚠ Humidity level is too low."
  }

  if (data.pestDetected === true) {
    return "⚠ Pest attack detected."
  }

  return null
}


// Convert raw sensor data to dashboard format
export const normalizeSensorData = (rawData) => {

  return {
    soil: rawData.soil || 0,
    temperature: rawData.temperature || 0,
    humidity: rawData.humidity || 0,
    light: rawData.light || 0
  }
}


// Random demo data generator (for testing dashboard)
export const generateMockData = () => {

  return {
    soil: Math.floor(Math.random() * 100),
    temperature: 25 + Math.floor(Math.random() * 10),
    humidity: 40 + Math.floor(Math.random() * 30),
    light: 200 + Math.floor(Math.random() * 400)
  }
}
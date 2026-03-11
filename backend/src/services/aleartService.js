export const generateAlert = (data) => {

  if (data.soil < 30) {
    return "Soil moisture critically low"
  }

  if (data.temperature > 40) {
    return "High temperature detected"
  }

  if (data.humidity < 20) {
    return "Low humidity"
  }

  return null
}
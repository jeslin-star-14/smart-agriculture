export const detectProtocol = (data) => {

  if (data.soil < 30) {
    return "HIGH_PRIORITY_WIFI"
  }

  if (data.temperature > 40) {
    return "LOW_LATENCY_MODE"
  }

  return "POWER_SAVING_LORA"

}
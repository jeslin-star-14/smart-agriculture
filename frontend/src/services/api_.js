import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api"
})

export const fetchLatestSensorData = () => {
  return api.get("/sensor/latest")
}

export const fetchHistory = () => {
  return api.get("/sensor/history")
}

export const fetchDeviceStatus = () => {
  return api.get("/device")
}

export default api
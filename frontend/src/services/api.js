import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:3001/api"
})

export const getLatestData = () => API.get("/sensor/latest")
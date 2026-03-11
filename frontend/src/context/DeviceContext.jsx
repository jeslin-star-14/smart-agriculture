import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"

const DeviceContext = createContext()

const socket = io("http://localhost:5000")

export const DeviceProvider = ({ children }) => {

  const [deviceConnected, setDeviceConnected] = useState(false)

  const [sensorData, setSensorData] = useState({
    soil: 0,
    temperature: 0,
    humidity: 0,
    light: 0
  })

  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {

    socket.on("connect", () => {
      setDeviceConnected(true)
    })

    socket.on("disconnect", () => {
      setDeviceConnected(false)
    })

    socket.on("sensorData", (data) => {

      setSensorData({
        soil: data.soil,
        temperature: data.temperature,
        humidity: data.humidity,
        light: data.light
      })

      setLastUpdated(new Date().toLocaleTimeString())

      setDeviceConnected(true)
    })

  }, [])

  const value = {
    deviceConnected,
    sensorData,
    lastUpdated
  }

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  )
}

export const useDevice = () => {
  return useContext(DeviceContext)
}
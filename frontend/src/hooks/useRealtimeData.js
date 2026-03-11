import { useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default function useRealtimeData() {

  const [data, setData] = useState({})
  const [connected, setConnected] = useState(false)

  useEffect(() => {

    socket.on("sensorData", (msg) => {
      setData(msg)
      setConnected(true)
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

  }, [])

  return { data, connected }
}
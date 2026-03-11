import { useEffect, useState } from "react"
import { fetchDeviceStatus } from "../services/api"

export default function useDeviceStatus() {

  const [connected, setConnected] = useState(false)

  useEffect(() => {

    const interval = setInterval(async () => {

      const res = await fetchDeviceStatus()

      setConnected(res.data.connected)

    }, 5000)

    return () => clearInterval(interval)

  }, [])

  return connected
}
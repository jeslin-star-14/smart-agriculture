import SensorCard from "../components/SensorCard"
import StatusIndicator from "../components/StatusIndicator"
import AlertBox from "../components/AlertBox"
import SensorChart from "../components/SensorChart"
import useRealtimeData from "../hooks/useRealtimeData"

export default function Dashboard() {

  const { data, connected } = useRealtimeData()

  let alert = null

  if (data.soil < 30) {
    alert = "Soil moisture critically low!"
  }

  return (
    <div className="dashboard">

      <StatusIndicator status={connected} />

      <div className="grid">

        <SensorCard title="Soil Moisture" value={data.soil || 0} unit="%" />

        <SensorCard title="Temperature" value={data.temperature || 0} unit="°C" />

        <SensorCard title="Humidity" value={data.humidity || 0} unit="%" />

        <SensorCard title="Light" value={data.light || 0} unit="lux" />

      </div>

      <AlertBox message={alert} />

      <SensorChart data={[data]} />

    </div>
  )
}
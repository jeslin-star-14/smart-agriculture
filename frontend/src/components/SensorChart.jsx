import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

export default function SensorChart({ data }) {

  const chartData = {
    labels: data.map((d, i) => i),
    datasets: [
      {
        label: "Soil Moisture",
        data: data.map(d => d.soil),
        borderWidth: 2
      }
    ]
  }

  return <Line data={chartData} />
}
export default function SensorCard({ title, value, unit }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{value} {unit}</p>
    </div>
  )
}
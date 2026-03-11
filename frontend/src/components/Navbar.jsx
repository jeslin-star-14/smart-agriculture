import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <div className="navbar">
      <h2>Smart Agriculture IoT</h2>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/devices">Devices</Link>
        <Link to="/history">History</Link>
      </div>
    </div>
  )
}
import Navbar from "./components/Navbar";
import SensorCard from "./components/SensorCard";

function App() {
  const data = {
    soil: 45,
    temp: 28,
    humidity: 60,
    light: 350
  };

  return (
    <div style={styles.container}>
      <Navbar />

      <h2 style={styles.title}>Farm Sensor Dashboard</h2>

      <div style={styles.grid}>
        <SensorCard title="Soil Moisture" value={data.soil} unit="%" />
        <SensorCard title="Temperature" value={data.temp} unit="°C" />
        <SensorCard title="Humidity" value={data.humidity} unit="%" />
        <SensorCard title="Light" value={data.light} unit="lux" />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Poppins"
  },
  title: {
    marginBottom: "20px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px"
  }
};

export default App;
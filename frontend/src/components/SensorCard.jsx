export default function SensorCard({ title, value, unit }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <h1>{value} {unit}</h1>
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  }
};
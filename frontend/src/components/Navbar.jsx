import { useState, useEffect } from "react";

export default function Navbar() {
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    fetch("http://localhost:5000/api/sensor/latest")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStatus("Connected");
        }
      })
      .catch(() => {
        setStatus("Disconnected");
      });
  }, []);

  return (
    <div style={styles.nav}>
      <h1>🌱 Smart Agriculture IoT</h1>
      <p>
        Status:
        <span style={{ color: status === "Connected" ? "green" : "red" }}>
          {" "}{status}
        </span>
      </p>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  }
};
// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";

export default function Navbar({ connStatus, monitoring, onStart, onStop }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const statusColor = {
    disconnected: "#ef4444",
    connecting:   "#f59e0b",
    connected:    "#22c55e",
  }[connStatus] || "#ef4444";

  const statusLabel = {
    disconnected: "Not Connected",
    connecting:   "Connecting…",
    connected:    "Arduino Connected",
  }[connStatus] || "Not Connected";

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={{ fontSize: "2rem" }}>🌱</span>
        <div>
          <div style={styles.brandName}>Smart Agriculture IoT</div>
          <div style={styles.brandSub}>Real-Time Farm Monitor</div>
        </div>
      </div>

      <div style={styles.center}>
        {connStatus === "connected" && !monitoring && (
          <button style={{ ...styles.btn, ...styles.btnStart }} onClick={onStart}>
            ▶ Start Live Monitor
          </button>
        )}
        {monitoring && (
          <button style={{ ...styles.btn, ...styles.btnStop }} onClick={onStop}>
            ■ Stop Monitoring
          </button>
        )}
        {connStatus !== "connected" && (
          <span style={styles.waitMsg}>
            {connStatus === "connecting"
              ? "⟳ Connecting to Arduino…"
              : "Plug in Arduino & start the backend server"}
          </span>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.statusRow}>
          <span style={{
            ...styles.dot,
            background: statusColor,
            boxShadow: connStatus === "connected" ? `0 0 10px ${statusColor}` : "none",
          }} />
          <span style={{ ...styles.statusText, color: statusColor }}>{statusLabel}</span>
        </div>
        <div style={styles.clock}>{time}</div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 36px", height: "76px",
    background: "#0a0f0d", borderBottom: "1px solid #1e3326",
    fontFamily: "'Space Mono', monospace",
    position: "sticky", top: 0, zIndex: 100, gap: "16px",
  },
  brand: { display: "flex", alignItems: "center", gap: "14px" },
  brandName: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.4rem",
    color: "#d4edd9", letterSpacing: "-0.01em",
  },
  brandSub: { fontSize: "0.75rem", color: "#4a7a58", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "2px" },
  center: { display: "flex", alignItems: "center" },
  btn: {
    fontFamily: "'Space Mono', monospace", fontSize: "0.95rem",
    letterSpacing: "0.06em", textTransform: "uppercase",
    border: "none", borderRadius: "8px", padding: "12px 28px",
    cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
  },
  btnStart: { background: "#00ff7f", color: "#040f08" },
  btnStop:  { background: "#ef4444", color: "#fff" },
  waitMsg: { fontSize: "0.9rem", color: "#4a7a58" },
  right: { textAlign: "right", minWidth: "180px" },
  statusRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" },
  dot: { width: 11, height: 11, borderRadius: "50%", flexShrink: 0, transition: "background 0.3s" },
  statusText: { fontSize: "1rem", fontWeight: 700, fontFamily: "'Syne', sans-serif" },
  clock: { fontSize: "0.85rem", color: "#4a7a58", marginTop: "4px" },
};
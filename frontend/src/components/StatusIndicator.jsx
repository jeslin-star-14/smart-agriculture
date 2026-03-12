// frontend/src/components/StatusIndicator.jsx
import { useEffect, useState } from "react";

export default function StatusIndicator({ status = "disconnected", msgRate = 0 }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (status === "connected") {
      const id = setInterval(() => setPulse(p => !p), 900);
      return () => clearInterval(id);
    }
    setPulse(false);
  }, [status]);

  const colors = { disconnected: "#ef4444", scanning: "#f59e0b", connecting: "#f59e0b", connected: "#22c55e" };
  const labels = {
    disconnected: "Arduino Not Connected",
    connecting:   "Connecting to Arduino…",
    connected:    "Arduino Connected ✓",
  };

  const color = colors[status] || colors.disconnected;

  return (
    <div style={wrapStyle}>
      <div style={{ position: "relative", width: 18, height: 18, flexShrink: 0 }}>
        {status === "connected" && (
          <div style={{
            ...dotRing, background: color,
            opacity: pulse ? 0 : 0.3,
            transform: pulse ? "scale(2.8)" : "scale(1)",
          }} />
        )}
        <div style={{ ...dot, background: color }} />
      </div>

      <div style={textWrap}>
        <div style={{ ...statusLabel, color }}>{labels[status] || "Unknown"}</div>
        <div style={subLabel}>
          {status === "disconnected" && "Start your backend server and plug in your Arduino via USB"}
          {status === "connecting"   && "Opening serial port, please wait…"}
          {status === "connected"    && `Serial port open · 9600 baud · ${msgRate} msg/s live`}
        </div>
      </div>

      <div style={pillRow}>
        <Pill label="MQTT"      active={status === "connected"} />
        <Pill label="WebSocket" active={status === "connected"} />
        <Pill label="Serial"    active={status === "connected"} />
      </div>
    </div>
  );
}

function Pill({ label, active }) {
  return (
    <div style={{
      ...pillBase,
      background: active ? "#001a0a" : "#0d1a10",
      border: `1px solid ${active ? "#00ff7f" : "#1e3326"}`,
      color: active ? "#00ff7f" : "#2e5a3a",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#00ff7f" : "#2e5a3a", flexShrink: 0 }} />
      {label}
    </div>
  );
}

const wrapStyle = {
  display: "flex", alignItems: "center", gap: "18px",
  background: "#111a14", border: "1px solid #1e3326",
  borderRadius: "12px", padding: "18px 24px",
  margin: "0 0 28px", fontFamily: "'Space Mono', monospace", flexWrap: "wrap",
};
const dot = {
  width: 18, height: 18, borderRadius: "50%",
  position: "absolute", top: 0, left: 0, transition: "background 0.3s",
};
const dotRing = {
  width: 18, height: 18, borderRadius: "50%",
  position: "absolute", top: 0, left: 0,
  transition: "opacity 0.9s ease, transform 0.9s ease",
};
const textWrap = { flex: 1, minWidth: 200 };
const statusLabel = {
  fontFamily: "'Syne', sans-serif", fontWeight: 700,
  fontSize: "1.1rem", transition: "color 0.3s",
};
const subLabel = { fontSize: "0.82rem", color: "#4a7a58", marginTop: "4px" };
const pillRow = { display: "flex", gap: "8px", flexWrap: "wrap" };
const pillBase = {
  display: "flex", alignItems: "center", gap: "6px",
  fontSize: "0.78rem", letterSpacing: "0.06em",
  padding: "6px 14px", borderRadius: "20px", transition: "all 0.3s",
  fontWeight: 700,
};
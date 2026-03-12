// frontend/src/components/StatusIndicator.jsx
// REPLACE your existing StatusIndicator.jsx with this file

import { useEffect, useState } from "react";

export default function StatusIndicator({ status = "disconnected", port = null, msgRate = 0 }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (status === "connected") {
      const id = setInterval(() => setPulse(p => !p), 900);
      return () => clearInterval(id);
    }
    setPulse(false);
  }, [status]);

  const colors = {
    disconnected: "#ef4444",
    scanning: "#f59e0b",
    connected: "#22c55e",
  };

  const labels = {
    disconnected: "Arduino Not Connected",
    scanning: "Scanning for boards…",
    connected: "Arduino Connected ✓",
  };

  const color = colors[status] || colors.disconnected;

  return (
    <div style={wrapStyle}>
      {/* Pulsing dot */}
      <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
        {status === "connected" && (
          <div style={{
            ...dotRing,
            background: color,
            opacity: pulse ? 0 : 0.35,
            transform: pulse ? "scale(2.5)" : "scale(1)",
          }} />
        )}
        <div style={{ ...dot, background: color }} />
      </div>

      <div style={textWrap}>
        <div style={{ ...statusLabel, color }}>{labels[status]}</div>
        <div style={subLabel}>
          {status === "disconnected" && "Click 'Scan Arduino' in the toolbar to connect"}
          {status === "scanning" && "Requesting serial port access…"}
          {status === "connected" && `Serial port open · 9600 baud · ${msgRate} msg/s`}
        </div>
      </div>

      {/* Status pills */}
      <div style={pillRow}>
        <Pill label="MQTT" active={status === "connected"} />
        <Pill label="WebSocket" active={status === "connected"} />
        <Pill label="Serial" active={status === "connected"} />
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
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#00ff7f" : "#2e5a3a", flexShrink: 0 }} />
      {label}
    </div>
  );
}

const wrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  background: "#111a14",
  border: "1px solid #1e3326",
  borderRadius: "10px",
  padding: "14px 20px",
  margin: "0 0 24px",
  fontFamily: "'Space Mono', monospace",
  flexWrap: "wrap",
};

const dot = {
  width: 14, height: 14,
  borderRadius: "50%",
  position: "absolute", top: 0, left: 0,
  transition: "background 0.3s",
};

const dotRing = {
  width: 14, height: 14,
  borderRadius: "50%",
  position: "absolute", top: 0, left: 0,
  transition: "opacity 0.9s ease, transform 0.9s ease",
};

const textWrap = { flex: 1, minWidth: 180 };

const statusLabel = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  fontSize: "0.9rem",
  transition: "color 0.3s",
};

const subLabel = {
  fontSize: "0.62rem",
  color: "#4a7a58",
  marginTop: "3px",
};

const pillRow = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const pillBase = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "0.58rem",
  letterSpacing: "0.08em",
  padding: "4px 10px",
  borderRadius: "20px",
  transition: "all 0.3s",
};
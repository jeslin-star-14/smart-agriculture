// frontend/src/components/Navbar.jsx
// REPLACE your existing Navbar.jsx with this file

import { useState, useEffect, useRef } from "react";

export default function Navbar({ onMonitoringChange }) {
  const [connState, setConnState] = useState("disconnected"); // disconnected | scanning | connected
  const [monitoring, setMonitoring] = useState(false);
  const [time, setTime] = useState("");
  const portRef = useRef(null);
  const readerRef = useRef(null);

  // Live clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Check Web Serial support
  const hasSerial = "serial" in navigator;

  async function scanPorts() {
    setConnState("scanning");
    if (!hasSerial) {
      // Demo mode — simulate connection after 1.5s
      setTimeout(() => {
        setConnState("connected");
      }, 1500);
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setConnState("connected");
    } catch (e) {
      setConnState("disconnected");
    }
  }

  async function startMonitoring() {
    setMonitoring(true);
    onMonitoringChange && onMonitoringChange(true, portRef.current);
  }

  async function stopMonitoring() {
    setMonitoring(false);
    onMonitoringChange && onMonitoringChange(false, null);
    if (readerRef.current) {
      try { await readerRef.current.cancel(); } catch (_) {}
      readerRef.current = null;
    }
  }

  const statusColor = {
    disconnected: "#ef4444",
    scanning: "#f59e0b",
    connected: "#22c55e",
  }[connState];

  const statusLabel = {
    disconnected: "Disconnected",
    scanning: "Scanning…",
    connected: "Arduino Connected",
  }[connState];

  return (
    <nav style={styles.nav}>
      {/* Left — brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🌱</span>
        <div>
          <div style={styles.brandName}>Smart Agriculture IoT</div>
          <div style={styles.brandSub}>Real-Time Farm Monitor</div>
        </div>
      </div>

      {/* Center — actions */}
      <div style={styles.actions}>
        {connState !== "connected" && (
          <button
            style={{ ...styles.btn, ...styles.btnScan, opacity: connState === "scanning" ? 0.6 : 1 }}
            onClick={scanPorts}
            disabled={connState === "scanning"}
          >
            {connState === "scanning" ? (
              <><span style={styles.spinner} /> Scanning…</>
            ) : (
              <><span>⟳</span> Scan Arduino</>
            )}
          </button>
        )}

        {connState === "connected" && !monitoring && (
          <button style={{ ...styles.btn, ...styles.btnStart }} onClick={startMonitoring}>
            ▶ Start Live Monitor
          </button>
        )}

        {monitoring && (
          <button style={{ ...styles.btn, ...styles.btnStop }} onClick={stopMonitoring}>
            ■ Stop
          </button>
        )}
      </div>

      {/* Right — status + clock */}
      <div style={styles.right}>
        <div style={styles.statusRow}>
          <span style={{ ...styles.dot, background: statusColor, boxShadow: connState === "connected" ? `0 0 8px ${statusColor}` : "none" }} />
          <span style={{ ...styles.statusText, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        {!hasSerial && connState === "disconnected" && (
          <div style={styles.demoNote}>Use Chrome/Edge for real Arduino</div>
        )}
        <div style={styles.clock}>{time}</div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: "68px",
    background: "#0a0f0d",
    borderBottom: "1px solid #1e3326",
    fontFamily: "'Space Mono', monospace",
    position: "sticky",
    top: 0,
    zIndex: 100,
    gap: "16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandIcon: { fontSize: "1.5rem" },
  brandName: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1rem",
    color: "#d4edd9",
    letterSpacing: "-0.01em",
  },
  brandSub: {
    fontSize: "0.6rem",
    color: "#4a7a58",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  actions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  btn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: "none",
    borderRadius: "6px",
    padding: "8px 18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    fontWeight: 700,
  },
  btnScan: {
    background: "transparent",
    border: "1px solid #2e5a3a",
    color: "#7ab88a",
  },
  btnStart: {
    background: "#00ff7f",
    color: "#040f08",
  },
  btnStop: {
    background: "#ef4444",
    color: "#fff",
  },
  spinner: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    border: "2px solid #4a7a58",
    borderTopColor: "#00ff7f",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  right: {
    textAlign: "right",
    minWidth: "160px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "7px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.3s, box-shadow 0.3s",
  },
  statusText: {
    fontSize: "0.72rem",
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
  },
  demoNote: {
    fontSize: "0.55rem",
    color: "#f59e0b",
    textAlign: "right",
    marginTop: "2px",
  },
  clock: {
    fontSize: "0.65rem",
    color: "#4a7a58",
    marginTop: "3px",
    textAlign: "right",
  },
};
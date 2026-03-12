// frontend/src/App.jsx
// REPLACE your existing App.jsx with this file

import { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import SensorCard from "./components/SensorCard";
import SensorChart from "./components/SensorChart";
import StatusIndicator from "./components/StatusIndicator";

const INITIAL_DATA = {
  temperature: "--.-",
  humidity: "--.-",
  soilMoisture: "--.-",
  light: "---",
  ph: "-.-",
  rain: "--",
};

const SENSOR_CARDS = [
  { key: "temperature", label: "Temperature", icon: "🌡", unit: "°C", type: "temperature" },
  { key: "humidity",    label: "Humidity",    icon: "💧", unit: "% RH", type: "humidity" },
  { key: "soilMoisture",label: "Soil Moisture",icon:"🌱", unit: "%", type: "soil" },
  { key: "light",       label: "Light Level", icon: "☀️", unit: "lux", type: "light" },
  { key: "ph",          label: "Soil pH",     icon: "⚗️", unit: "pH", type: "ph" },
  { key: "rain",        label: "Rain Sensor", icon: "🌧", unit: "status", type: "rain" },
];

export default function App() {
  const [connStatus, setConnStatus] = useState("disconnected");
  const [monitoring, setMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState(INITIAL_DATA);
  const [msgRate, setMsgRate] = useState(0);
  const [logs, setLogs] = useState([{ ts: "--:--:--", msg: "Waiting for connection…", cls: "info" }]);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const demoRef = useRef(null);
  const msgCountRef = useRef(0);
  const demoState = useRef({ temp: 24, hum: 62, soil: 48, light: 350, ph: 6.8, rain: 0 });

  const hasSerial = "serial" in navigator;

  // ── Message rate counter ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setMsgRate(msgCountRef.current);
      msgCountRef.current = 0;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function addLog(msg, cls = "info") {
    const ts = new Date().toLocaleTimeString("en-GB");
    setLogs(prev => {
      const next = [...prev, { ts, msg, cls }];
      return next.length > 100 ? next.slice(-100) : next;
    });
  }

  // ── Called from Navbar ────────────────────────────────────
  function handleNavbarAction(action, port) {
    if (action === "scan") {
      setConnStatus("scanning");
      addLog("Scanning for Arduino boards…", "info");

      if (!hasSerial) {
        setTimeout(() => {
          setConnStatus("connected");
          addLog("Arduino Uno detected on COM3 (demo mode)", "ok");
          addLog("Board ready · Baud 9600 · Click Start to stream", "ok");
        }, 1500);
        return;
      }

      // Real serial — port already opened in Navbar, passed here
      if (port) {
        portRef.current = port;
        setConnStatus("connected");
        addLog("Serial port opened successfully", "ok");
        addLog("Arduino ready · click Start Live Monitor", "ok");
      } else {
        setConnStatus("disconnected");
        addLog("No port selected", "err");
      }
    }

    if (action === "start") {
      setMonitoring(true);
      addLog("Live monitoring started", "ok");
      if (!hasSerial) startDemo();
      else startSerialRead();
    }

    if (action === "stop") {
      setMonitoring(false);
      addLog("Monitoring paused", "warn");
      clearInterval(demoRef.current);
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
    }
  }

  // ── Demo stream ───────────────────────────────────────────
  function startDemo() {
    const d = demoState.current;
    demoRef.current = setInterval(() => {
      d.temp  = clamp(d.temp  + rand(-0.5, 0.5), 15, 50);
      d.hum   = clamp(d.hum   + rand(-1, 1),     20, 95);
      d.soil  = clamp(d.soil  + rand(-2, 2),     10, 90);
      d.light = clamp(d.light + rand(-20, 20),   0, 900);
      d.ph    = clamp(d.ph    + rand(-0.05, 0.05), 4.5, 8.5);
      d.rain  = Math.random() < 0.05 ? 1 : 0;

      const payload = {
        temperature: d.temp.toFixed(1),
        humidity: d.hum.toFixed(1),
        soilMoisture: d.soil.toFixed(1),
        light: Math.round(d.light),
        ph: d.ph.toFixed(2),
        rain: d.rain,
      };
      setSensorData(payload);
      msgCountRef.current++;
      addLog(JSON.stringify({ temp: payload.temperature, hum: payload.humidity, soil: payload.soilMoisture, light: payload.light }), "info");
    }, 800);
  }

  // ── Real Serial read ──────────────────────────────────────
  async function startSerialRead() {
    try {
      const port = portRef.current;
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop();
        lines.forEach(line => {
          line = line.trim();
          if (!line) return;
          addLog(line, "info");
          parseAndSet(line);
          msgCountRef.current++;
        });
      }
    } catch (e) {
      addLog("Serial error: " + e.message, "err");
    }
  }

  // ── Parse JSON or CSV from Arduino ───────────────────────
  // JSON: {"temp":25.4,"hum":60,"soil":45,"light":320,"ph":6.8,"rain":0}
  // CSV:  25.4,60,45,320,6.8,0
  function parseAndSet(raw) {
    try {
      let obj;
      if (raw.startsWith("{")) {
        obj = JSON.parse(raw);
      } else {
        const [temp, hum, soil, light, ph, rain] = raw.split(",").map(Number);
        obj = { temp, hum, soil, light, ph, rain };
      }
      setSensorData(prev => ({
        ...prev,
        ...(obj.temp  !== undefined && { temperature: parseFloat(obj.temp).toFixed(1) }),
        ...(obj.hum   !== undefined && { humidity: parseFloat(obj.hum).toFixed(1) }),
        ...(obj.soil  !== undefined && { soilMoisture: parseFloat(obj.soil).toFixed(1) }),
        ...(obj.light !== undefined && { light: Math.round(obj.light) }),
        ...(obj.ph    !== undefined && { ph: parseFloat(obj.ph).toFixed(2) }),
        ...(obj.rain  !== undefined && { rain: obj.rain }),
      }));
    } catch (_) {}
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ── Navbar callback ───────────────────────────────────────
  // Navbar now calls this with (action, port)
  function handleMonitoringChange(isStarting, port) {
    if (port !== undefined && port !== null && connStatus !== "connected") {
      // Port was just opened
      portRef.current = port;
      setConnStatus("connected");
      addLog("Arduino connected on serial port", "ok");
    }
    if (isStarting) handleNavbarAction("start", port);
    else handleNavbarAction("stop", null);
  }

  // Wire scan separately — Navbar calls onMonitoringChange(true/false, port)
  // But we also need scan. Let's detect: if not monitoring and port passed → connected
  function handleNavbarCallback(isStarting, port) {
    if (connStatus === "disconnected" || connStatus === "scanning") {
      // This means scan just finished
      if (!hasSerial) {
        handleNavbarAction("scan", null);
        return;
      }
      if (port) {
        portRef.current = port;
        setConnStatus("connected");
        addLog("Arduino connected on serial port", "ok");
      }
      return;
    }
    handleMonitoringChange(isStarting, port);
  }

  return (
    <div style={appStyle}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap" rel="stylesheet" />

      <Navbar onMonitoringChange={handleNavbarCallback} />

      <main style={mainStyle}>
        <h2 style={sectionTitle}>Farm Sensor Dashboard</h2>

        {/* Status row */}
        <StatusIndicator status={connStatus} msgRate={msgRate} />

        {/* Sensor cards */}
        <div style={gridStyle}>
          {SENSOR_CARDS.map(card => (
            <SensorCard
              key={card.key}
              label={card.label}
              value={sensorData[card.key]}
              unit={card.unit}
              icon={card.icon}
              type={card.type}
            />
          ))}
        </div>

        {/* Live chart */}
        <SensorChart sensorData={monitoring ? sensorData : null} />

        {/* Serial log */}
        <div style={logPanel}>
          <div style={logHeader}>
            <span style={logTitle}>Serial Monitor</span>
            <span style={{ ...logBadge, ...(monitoring ? logBadgeLive : {}) }}>
              {monitoring ? "● LIVE" : "IDLE"}
            </span>
          </div>
          <div style={logBody} id="serial-log-body">
            {logs.map((l, i) => (
              <div key={i} style={logLine}>
                <span style={logTs}>{l.ts}</span>
                <span style={{ ...logMsg, color: { ok: "#00ff7f", warn: "#f59e0b", err: "#ef4444", info: "#7ab88a" }[l.cls] }}>
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom status bar */}
        <div style={statusBar}>
          <StatusDot active={connStatus === "connected"} /> Connection: {connStatus}
          <span style={{ marginLeft: 20 }}><StatusDot active={monitoring} color="#f59e0b" /> Data Rate: {msgRate} msg/s</span>
          <span style={{ marginLeft: 20 }}><StatusDot active={true} /> Protocol: JSON / CSV auto-detect</span>
        </div>
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f0d; color: #d4edd9; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: linear-gradient(#0d1f14 1px, transparent 1px),
            linear-gradient(90deg, #0d1f14 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        #serial-log-body { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

function StatusDot({ active, color = "#22c55e" }) {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: active ? color : "#2e5a3a", marginRight: 5,
      verticalAlign: "middle",
    }} />
  );
}

const appStyle = { minHeight: "100vh", fontFamily: "'Space Mono', monospace", position: "relative", zIndex: 1 };
const mainStyle = { maxWidth: 1100, margin: "0 auto", padding: "28px 20px", position: "relative", zIndex: 1 };
const sectionTitle = { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#d4edd9", marginBottom: "20px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" };
const logPanel = { background: "#111a14", border: "1px solid #1e3326", borderRadius: "10px", overflow: "hidden", marginBottom: "24px" };
const logHeader = { padding: "12px 18px", borderBottom: "1px solid #1e3326", display: "flex", justifyContent: "space-between", alignItems: "center" };
const logTitle = { fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#d4edd9" };
const logBadge = { fontSize: "0.6rem", padding: "3px 9px", borderRadius: "20px", background: "#0d1a10", border: "1px solid #1e3326", color: "#4a7a58", fontFamily: "'Space Mono', monospace" };
const logBadgeLive = { background: "#001a0a", borderColor: "#00ff7f", color: "#00ff7f" };
const logBody = { height: 160, overflowY: "auto", padding: "10px 18px", fontSize: "0.68rem" };
const logLine = { display: "flex", gap: 10, lineHeight: 1.8 };
const logTs = { color: "#2e5a3a", flexShrink: 0 };
const logMsg = { fontFamily: "'Space Mono', monospace" };
const statusBar = { fontSize: "0.65rem", color: "#4a7a58", paddingTop: 12, borderTop: "1px solid #1e3326", display: "flex", flexWrap: "wrap", alignItems: "center" };
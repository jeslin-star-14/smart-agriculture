// frontend/src/App.jsx
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import SensorCard from "./components/SensorCard";
import SensorChart from "./components/SensorChart";
import StatusIndicator from "./components/StatusIndicator";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const INIT = { temperature:"--.-", humidity:"--.-", soilMoisture:"--.-", light:"---", ph:"-.-", rain:"--" };

const CARDS = [
  { key:"temperature",  label:"Temperature",  icon:"🌡", unit:"°C",    type:"temperature" },
  { key:"humidity",     label:"Humidity",     icon:"💧", unit:"% RH", type:"humidity" },
  { key:"soilMoisture", label:"Soil Moisture",icon:"🌱", unit:"%",    type:"soil" },
  { key:"light",        label:"Light Level",  icon:"☀️", unit:"lux",  type:"light" },
  { key:"ph",           label:"Soil pH",      icon:"⚗️", unit:"pH",   type:"ph" },
  { key:"rain",         label:"Rain Sensor",  icon:"🌧", unit:"status",type:"rain" },
];

export default function App() {
  const [connStatus, setConnStatus] = useState("connecting");
  const [monitoring, setMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState(INIT);
  const [msgRate, setMsgRate]       = useState(0);
  const [logs, setLogs]             = useState([{ ts:"--:--:--", msg:"Connecting to backend…", cls:"info" }]);
  const socketRef  = useRef(null);
  const msgRef     = useRef(0);
  const monitorRef = useRef(false);

  function addLog(msg, cls="info") {
    const ts = new Date().toLocaleTimeString("en-GB");
    setLogs(p => { const n=[...p,{ts,msg,cls}]; return n.length>120?n.slice(-120):n; });
  }

  useEffect(() => {
    const id = setInterval(() => { setMsgRate(msgRef.current); msgRef.current=0; }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports:["websocket"] });
    socketRef.current = socket;

    socket.on("connect",    () => addLog("Connected to backend server","ok"));
    socket.on("disconnect", () => { addLog("Backend disconnected","err"); setConnStatus("disconnected"); setMonitoring(false); monitorRef.current=false; });

    socket.on("arduino_status", ({ connected, port, error }) => {
      if (connected) { setConnStatus("connected"); addLog(`✓ Arduino on ${port}`,"ok"); }
      else { setConnStatus("disconnected"); addLog(error||"Arduino disconnected","warn"); setMonitoring(false); monitorRef.current=false; }
    });

    socket.on("sensor_data", (data) => {
      if (!monitorRef.current) return;
      setSensorData({
        temperature:  data.temperature  != null ? String(data.temperature)  : INIT.temperature,
        humidity:     data.humidity     != null ? String(data.humidity)     : INIT.humidity,
        soilMoisture: data.soilMoisture != null ? String(data.soilMoisture) : INIT.soilMoisture,
        light:        data.light        != null ? String(data.light)        : INIT.light,
        ph:           data.ph           != null ? String(data.ph)           : INIT.ph,
        rain:         data.rain         != null ? data.rain                 : INIT.rain,
      });
      msgRef.current++;
      addLog(`T:${data.temperature}°C  H:${data.humidity}%  Soil:${data.soilMoisture}%  Light:${data.light}lux`,"info");
    });

    return () => socket.disconnect();
  }, []);

  function handleStart() { monitorRef.current=true; setMonitoring(true); setSensorData(INIT); addLog("▶ Live monitoring started","ok"); }
  function handleStop()  { monitorRef.current=false; setMonitoring(false); addLog("■ Monitoring stopped","warn"); }

  const logColor = { ok:"#00ff7f", warn:"#f59e0b", err:"#ef4444", info:"#7ab88a" };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap" rel="stylesheet"/>
      <Navbar connStatus={connStatus} monitoring={monitoring} onStart={handleStart} onStop={handleStop}/>
      <main style={S.main}>
        <h2 style={S.title}>Farm Sensor Dashboard</h2>
        <StatusIndicator status={connStatus} msgRate={msgRate}/>
        <div style={S.grid}>
          {CARDS.map(c=><SensorCard key={c.key} label={c.label} value={sensorData[c.key]} unit={c.unit} icon={c.icon} type={c.type}/>)}
        </div>
        <SensorChart sensorData={monitoring?sensorData:null}/>

        {/* Log panel */}
        <div style={S.logPanel}>
          <div style={S.logHead}>
            <span style={S.logTitle}>Live Log</span>
            <span style={{...S.badge,...(monitoring?S.badgeLive:{})}}>{monitoring?"● LIVE":"IDLE"}</span>
          </div>
          <div style={S.logBody}>
            {logs.map((l,i)=>(
              <div key={i} style={S.logLine}>
                <span style={S.logTs}>{l.ts}</span>
                <span style={{color:logColor[l.cls]||"#7ab88a"}}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.bar}>
          <D active={connStatus==="connected"}/> Backend: {connStatus}
          <span style={{marginLeft:24}}><D active={monitoring} c="#f59e0b"/> Rate: {msgRate} msg/s</span>
          <span style={{marginLeft:24}}><D active/> Transport: Socket.io</span>
        </div>
      </main>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f0d; color: #d4edd9; font-size: 16px; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image:
            linear-gradient(#0d1f14 1px, transparent 1px),
            linear-gradient(90deg, #0d1f14 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }
      `}</style>
    </div>
  );
}

function D({active,c="#22c55e"}){
  return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:active?c:"#2e5a3a",marginRight:6,verticalAlign:"middle"}}/>;
}

const S = {
  app:      { minHeight:"100vh", fontFamily:"'Space Mono',monospace", position:"relative", zIndex:1 },
  main:     { maxWidth:1200, margin:"0 auto", padding:"32px 28px", position:"relative", zIndex:1 },
  title:    { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.5rem", color:"#d4edd9", marginBottom:"24px" },
  grid:     { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"18px", marginBottom:"28px" },
  logPanel: { background:"#111a14", border:"1px solid #1e3326", borderRadius:"12px", overflow:"hidden", marginBottom:"28px" },
  logHead:  { padding:"16px 22px", borderBottom:"1px solid #1e3326", display:"flex", justifyContent:"space-between", alignItems:"center" },
  logTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"1rem", color:"#d4edd9" },
  badge:    { fontSize:"0.78rem", padding:"5px 12px", borderRadius:"20px", background:"#0d1a10", border:"1px solid #1e3326", color:"#4a7a58", fontFamily:"'Space Mono',monospace", fontWeight:700 },
  badgeLive:{ background:"#001a0a", borderColor:"#00ff7f", color:"#00ff7f" },
  logBody:  { height:200, overflowY:"auto", padding:"12px 22px", fontSize:"0.82rem" },
  logLine:  { display:"flex", gap:14, lineHeight:2, fontFamily:"'Space Mono',monospace" },
  logTs:    { color:"#2e5a3a", flexShrink:0, fontSize:"0.78rem" },
  bar:      { fontSize:"0.82rem", color:"#4a7a58", paddingTop:14, borderTop:"1px solid #1e3326", display:"flex", flexWrap:"wrap", alignItems:"center" },
};
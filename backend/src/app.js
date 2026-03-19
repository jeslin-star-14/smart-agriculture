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
  const [logs, setLogs]             = useState([{ ts:"--:--:--", msg:"Connecting to backend server…", cls:"info" }]);
  const socketRef  = useRef(null);
  const msgRef     = useRef(0);
  const monitorRef = useRef(false);

  function addLog(msg, cls="info") {
    const ts = new Date().toLocaleTimeString("en-GB");
    setLogs(p=>{ const n=[...p,{ts,msg,cls}]; return n.length>120?n.slice(-120):n; });
  }

  useEffect(()=>{
    const id=setInterval(()=>{ setMsgRate(msgRef.current); msgRef.current=0; },1000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const socket=io(BACKEND_URL,{transports:["websocket"]});
    socketRef.current=socket;
    socket.on("connect",()=>addLog("Connected to backend server","ok"));
    socket.on("disconnect",()=>{ addLog("Backend disconnected","err"); setConnStatus("disconnected"); setMonitoring(false); monitorRef.current=false; });
    socket.on("arduino_status",({connected,port,error})=>{
      if(connected){ setConnStatus("connected"); addLog(`✓ Arduino on ${port}`,"ok"); }
      else{ setConnStatus("disconnected"); addLog(error||"Arduino not detected","warn"); setMonitoring(false); monitorRef.current=false; }
    });
    socket.on("sensor_data",(data)=>{
      if(!monitorRef.current)return;
      setSensorData({
        temperature:  data.temperature  !=null?String(data.temperature):INIT.temperature,
        humidity:     data.humidity     !=null?String(data.humidity):INIT.humidity,
        soilMoisture: data.soilMoisture !=null?String(data.soilMoisture):INIT.soilMoisture,
        light:        data.light        !=null?String(data.light):INIT.light,
        ph:           data.ph           !=null?String(data.ph):INIT.ph,
        rain:         data.rain         !=null?data.rain:INIT.rain,
      });
      msgRef.current++;
      addLog(`T:${data.temperature}°C  H:${data.humidity}%  Soil:${data.soilMoisture}%  Light:${data.light}lux`,"info");
    });
    return()=>socket.disconnect();
  },[]);

  function handleStart()  { monitorRef.current=true;  setMonitoring(true);  setSensorData(INIT); addLog("▶ Live monitoring started","ok"); }
  function handleStop()   { monitorRef.current=false; setMonitoring(false); addLog("■ Monitoring stopped","warn"); }
  function handleRetry()  { addLog("⟳ Retrying Arduino…","info"); setConnStatus("connecting"); socketRef.current?.emit("check_arduino"); }

  const logColor = { ok:"#10b981", warn:"#f59e0b", err:"#ef4444", info:"#60a5fa" };

  return (
    <div style={{minHeight:"100vh",fontFamily:"'Outfit',sans-serif",position:"relative",zIndex:1}}>
      <Navbar connStatus={connStatus} monitoring={monitoring} onStart={handleStart} onStop={handleStop} onRetry={handleRetry}/>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"28px 24px"}}>

        {/* Page header */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <div style={{fontSize:"0.72rem",color:"#3b82f6",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"}}>Farm Sensor Dashboard</div>
            <h1 style={{fontSize:"1.8rem",fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",lineHeight:1}}>Live Monitoring</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"0.78rem",color:"#475569"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:monitoring?"#10b981":"#334155",display:"inline-block"}}/>
            {monitoring?"Streaming live data":"Monitoring paused"}
            {monitoring && <span style={{color:"#60a5fa",fontFamily:"'JetBrains Mono',monospace"}}> · {msgRate} msg/s</span>}
          </div>
        </div>

        <StatusIndicator status={connStatus} msgRate={msgRate}/>

        {/* Sensor cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"16px",marginBottom:"24px"}}>
          {CARDS.map((c,i)=>(
            <div key={c.key} style={{animationDelay:`${i*0.06}s`}}>
              <SensorCard label={c.label} value={sensorData[c.key]} unit={c.unit} icon={c.icon} type={c.type}/>
            </div>
          ))}
        </div>

        {/* Chart */}
        <SensorChart sensorData={monitoring?sensorData:null}/>

        {/* Log */}
        <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.15)",borderRadius:"16px",overflow:"hidden",marginBottom:"20px",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)"}}>
          <div style={{padding:"16px 22px",borderBottom:"1px solid rgba(59,130,246,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:700,fontSize:"0.95rem",color:"#e2e8f0"}}>Serial Log</div>
            <div style={{
              fontSize:"0.72rem",fontWeight:600,padding:"4px 12px",borderRadius:"20px",fontFamily:"'JetBrains Mono',monospace",
              background:monitoring?"rgba(16,185,129,0.1)":"rgba(59,130,246,0.06)",
              border:`1px solid ${monitoring?"rgba(16,185,129,0.3)":"rgba(59,130,246,0.12)"}`,
              color:monitoring?"#10b981":"#334155",
            }}>{monitoring?"● LIVE":"IDLE"}</div>
          </div>
          <div style={{height:180,overflowY:"auto",padding:"12px 22px",fontSize:"0.78rem",fontFamily:"'JetBrains Mono',monospace"}}>
            {logs.map((l,i)=>(
              <div key={i} style={{display:"flex",gap:"16px",lineHeight:1.9}}>
                <span style={{color:"#1e40af",flexShrink:0}}>{l.ts}</span>
                <span style={{color:logColor[l.cls]||"#60a5fa"}}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer bar */}
        <div style={{display:"flex",flexWrap:"wrap",gap:"20px",fontSize:"0.75rem",color:"#334155",padding:"12px 0",borderTop:"1px solid rgba(59,130,246,0.08)",fontFamily:"'JetBrains Mono',monospace"}}>
          <span><Dot a={connStatus==="connected"} c="#10b981"/>Backend: {connStatus}</span>
          <span><Dot a={monitoring} c="#f59e0b"/>Rate: {msgRate} msg/s</span>
          <span><Dot a/>Transport: Socket.io WebSocket</span>
          <span><Dot a/>DB: MongoDB auto-save</span>
        </div>
      </main>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes popIn{from{opacity:0;transform:translate(-50%,-48%) scale(0.88)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
      `}</style>
    </div>
  );
}

function Dot({a,c="#3b82f6"}){
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:a?c:"#1e293b",marginRight:6,verticalAlign:"middle",boxShadow:a?`0 0 6px ${c}`:"none"}}/>;
}
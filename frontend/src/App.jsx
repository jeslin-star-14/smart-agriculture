// frontend/src/App.jsx — REPLACE your existing App.jsx
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import SensorCard from "./components/SensorCard";
import SensorChart from "./components/SensorChart";
import StatusIndicator from "./components/StatusIndicator";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HistoryPage from "./pages/History";

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
  const [authPage, setAuthPage]   = useState("login");
  const [page, setPage]           = useState("Dashboard");
  const [user, setUser]           = useState(null);
  const [loggedIn, setLoggedIn]     = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false); // prevents flash

  const [connStatus, setConnStatus] = useState("connecting");
  const [monitoring, setMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState(INIT);
  const [sensorHistory, setSensorHistory] = useState([]); // rolling 200 for analytics
  const [msgRate, setMsgRate]       = useState(0);
  const [logs, setLogs]             = useState([{ ts:"--:--:--", msg:"Connecting to backend…", cls:"info" }]);

  const socketRef  = useRef(null);
  const msgRef     = useRef(0);
  const monitorRef = useRef(false);

  // Verify token on mount — never skip login without backend confirmation
  useEffect(() => {
    async function checkSession() {
      const token = localStorage.getItem("agri_token");
      const saved = localStorage.getItem("agri_user");

      // No saved session → show login page
      if (!token || !saved) {
        setLoggedIn(false);
        setSessionChecked(true);
        return;
      }

      // Ask backend if token is still valid
      try {
        const base = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "http://localhost:5000";
        const res  = await fetch(base + "/api/auth/verify", {
          headers: { Authorization: "Bearer " + token },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || JSON.parse(saved));
          setLoggedIn(true);
        } else {
          // expired / invalid
          localStorage.removeItem("agri_token");
          localStorage.removeItem("agri_user");
          setLoggedIn(false);
        }
      } catch {
        // Backend not reachable → clear session, show login
        localStorage.removeItem("agri_token");
        localStorage.removeItem("agri_user");
        setLoggedIn(false);
      }
      setSessionChecked(true); // always show something after check
    }
    checkSession();
  }, []);

  function addLog(msg, cls="info") {
    const ts = new Date().toLocaleTimeString("en-GB");
    setLogs(p=>{ const n=[...p,{ts,msg,cls}]; return n.length>120?n.slice(-120):n; });
  }

  useEffect(()=>{
    const id=setInterval(()=>{ setMsgRate(msgRef.current); msgRef.current=0; },1000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    if(!loggedIn) return;
    const socket=io(BACKEND_URL,{transports:["websocket"]});
    socketRef.current=socket;
    socket.on("connect",()=>addLog("Connected to backend","ok"));
    socket.on("disconnect",()=>{ addLog("Backend disconnected","err"); setConnStatus("disconnected"); setMonitoring(false); monitorRef.current=false; });
    socket.on("arduino_status",({connected,port,error})=>{
      if(connected){ setConnStatus("connected"); addLog(`✓ Arduino on ${port}`,"ok"); }
      else{ setConnStatus("disconnected"); addLog(error||"Arduino not detected","warn"); setMonitoring(false); monitorRef.current=false; }
    });
    socket.on("sensor_data",(data)=>{
      if(!monitorRef.current)return;
      const d={
        temperature:  data.temperature  !=null?String(data.temperature):INIT.temperature,
        humidity:     data.humidity     !=null?String(data.humidity):INIT.humidity,
        soilMoisture: data.soilMoisture !=null?String(data.soilMoisture):INIT.soilMoisture,
        light:        data.light        !=null?String(data.light):INIT.light,
        ph:           data.ph           !=null?String(data.ph):INIT.ph,
        rain:         data.rain         !=null?data.rain:INIT.rain,
      };
      setSensorData(d);
      setSensorHistory(prev=>{
        const entry={...d,createdAt:new Date().toISOString()};
        const n=[...prev,entry];
        return n.length>200?n.slice(-200):n;
      });
      msgRef.current++;
      addLog(`T:${data.temperature}°C  H:${data.humidity}%  Soil:${data.soilMoisture}%  Light:${data.light}lux`,"info");
    });
    return()=>socket.disconnect();
  },[loggedIn]);

  function handleLogin(u)    { setUser(u); setLoggedIn(true); }
  function handleRegister(u) { setUser(u); setLoggedIn(true); }
  function handleLogout()    { localStorage.removeItem("agri_token"); localStorage.removeItem("agri_user"); setUser(null); setLoggedIn(false); setAuthPage("login"); setMonitoring(false); monitorRef.current=false; }
  function handleStart()     { monitorRef.current=true;  setMonitoring(true);  setSensorData(INIT); addLog("▶ Live monitoring started","ok"); }
  function handleStop()      { monitorRef.current=false; setMonitoring(false); addLog("■ Monitoring stopped","warn"); }
  function handleRetry()     { addLog("⟳ Retrying…","info"); setConnStatus("connecting"); socketRef.current?.emit("check_arduino"); }

  const logColor = { ok:"#10b981", warn:"#f59e0b", err:"#ef4444", info:"#60a5fa" };

  // Show spinner while checking saved session
  if (!sessionChecked) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", flexDirection:"column", gap:16 }}>
        <div style={{ width:48, height:48, border:"3px solid rgba(59,130,246,0.2)", borderTopColor:"#3b82f6", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
        <div style={{ color:"#475569", fontSize:"0.85rem" }}>Checking session…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!loggedIn) {
    if (authPage==="login")    return <LoginPage    onLogin={handleLogin}       onGoRegister={()=>setAuthPage("register")}/>;
    if (authPage==="register") return <RegisterPage onRegister={handleRegister} onGoLogin={()=>setAuthPage("login")}/>;
  }

  return (
    <div style={{minHeight:"100vh",fontFamily:"'Outfit',sans-serif",position:"relative",zIndex:1}}>
      <Navbar
        connStatus={connStatus} monitoring={monitoring}
        onStart={handleStart} onStop={handleStop} onRetry={handleRetry}
        user={user} onLogout={handleLogout}
        activePage={page} onPageChange={setPage}
      />

      <main style={{maxWidth:1280,margin:"0 auto",padding:"28px 24px"}}>

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        {page==="Dashboard" && (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"}}>
              <div>
                <div style={{fontSize:"0.7rem",color:"#3b82f6",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"}}>
                  Welcome back, {user?.name?.split(" ")[0]||"Farmer"} 👋
                </div>
                <h1 style={{fontSize:"1.8rem",fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",lineHeight:1}}>Live Farm Dashboard</h1>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"0.78rem",color:"#475569"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:monitoring?"#10b981":"#334155",display:"inline-block",boxShadow:monitoring?"0 0 6px #10b981":"none"}}/>
                {monitoring?`Streaming live · ${msgRate} msg/s`:"Monitoring paused"}
              </div>
            </div>
            <StatusIndicator status={connStatus} msgRate={msgRate}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"16px",marginBottom:"24px"}}>
              {CARDS.map((c,i)=>(
                <div key={c.key} style={{animation:`fadeUp 0.5s ease ${i*0.06}s both`}}>
                  <SensorCard label={c.label} value={sensorData[c.key]} unit={c.unit} icon={c.icon} type={c.type}/>
                </div>
              ))}
            </div>
            <SensorChart sensorData={monitoring?sensorData:null}/>
            {/* Log */}
            <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:"16px",overflow:"hidden",marginBottom:"20px"}}>
              <div style={{padding:"16px 22px",borderBottom:"1px solid rgba(59,130,246,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontWeight:700,fontSize:"0.95rem",color:"#e2e8f0"}}>Serial Log</div>
                <div style={{fontSize:"0.72rem",fontWeight:600,padding:"4px 12px",borderRadius:"20px",fontFamily:"'JetBrains Mono',monospace",background:monitoring?"rgba(16,185,129,0.1)":"rgba(59,130,246,0.06)",border:`1px solid ${monitoring?"rgba(16,185,129,0.3)":"rgba(59,130,246,0.1)"}`,color:monitoring?"#10b981":"#334155"}}>
                  {monitoring?"● LIVE":"IDLE"}
                </div>
              </div>
              <div style={{height:160,overflowY:"auto",padding:"10px 22px",fontSize:"0.78rem",fontFamily:"'JetBrains Mono',monospace"}}>
                {logs.map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:"14px",lineHeight:1.9}}>
                    <span style={{color:"#1e40af",flexShrink:0}}>{l.ts}</span>
                    <span style={{color:logColor[l.cls]||"#60a5fa"}}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"18px",fontSize:"0.72rem",color:"#1e293b",padding:"10px 0",borderTop:"1px solid rgba(59,130,246,0.07)",fontFamily:"'JetBrains Mono',monospace"}}>
              <span><Dot a={connStatus==="connected"} c="#10b981"/>Backend: {connStatus}</span>
              <span><Dot a={monitoring} c="#f59e0b"/>Rate: {msgRate} msg/s</span>
              <span><Dot a/>Transport: Socket.io</span>
              <span><Dot a/>DB: MongoDB</span>
            </div>
          </div>
        )}

        {page==="History"   && <HistoryPage/>}
      </main>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}70%{box-shadow:0 0 0 18px rgba(239,68,68,0)}}
        @keyframes popIn{from{opacity:0;transform:translate(-50%,-46%) scale(0.84)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes navPulse{0%,100%{opacity:1}50%{opacity:0.45}}
        input:focus,select:focus,textarea:focus{border-color:rgba(59,130,246,0.5)!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
        tr:hover td{background:rgba(59,130,246,0.04)}
      `}</style>
    </div>
  );
}

function Dot({a,c="#3b82f6"}){
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:a?c:"#1e293b",marginRight:6,verticalAlign:"middle",boxShadow:a?`0 0 6px ${c}`:"none"}}/>;
}
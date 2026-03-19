// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";

export default function Navbar({ connStatus, monitoring, onStart, onStop, onRetry }) {
  const [time, setTime]             = useState("");
  const [searching, setSearching]   = useState(false);
  const [showPopup, setShowPopup]   = useState(false);
  const [popupTimer, setPopupTimer] = useState(5);
  const [tryEnabled, setTryEnabled] = useState(false);
  const timerRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (connStatus === "connected" && searching) {
      setSearching(false);
      clearTimeout(timerRef.current);
    }
  }, [connStatus]);

  function handleStartClick() {
    if (connStatus === "connected") { onStart(); return; }
    setSearching(true); setTryEnabled(false);
    timerRef.current = setTimeout(() => {
      if (connStatus !== "connected") { setSearching(false); showPopupFn(); }
    }, 3000);
  }

  function showPopupFn() {
    setShowPopup(true); setPopupTimer(5); setTryEnabled(false);
    let r = 5;
    countRef.current = setInterval(() => {
      r--;
      setPopupTimer(r);
      if (r <= 0) { clearInterval(countRef.current); setShowPopup(false); setTryEnabled(true); }
    }, 1000);
  }

  function handleTryAgain() {
    setTryEnabled(false);
    onRetry && onRetry();
    setSearching(true);
    timerRef.current = setTimeout(() => {
      if (connStatus !== "connected") { setSearching(false); showPopupFn(); }
    }, 3000);
  }

  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(countRef.current); }, []);

  const statusColor = { disconnected:"#ef4444", connecting:"#f59e0b", connected:"#10b981" }[connStatus] || "#ef4444";
  const statusLabel = { disconnected:"Not Connected", connecting:"Connecting…", connected:"Live" }[connStatus] || "Not Connected";

  return (
    <>
      <nav style={N.nav}>
        {/* Brand */}
        <div style={N.brand}>
          <div style={N.logoBox}>🌿</div>
          <div>
            <div style={N.brandName}>AgriSense</div>
            <div style={N.brandSub}>Smart Agriculture IoT</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={N.links}>
          {["Dashboard","Sensors","History","Analytics","Settings"].map((l,i) => (
            <div key={l} style={{ ...N.link, ...(i===0?N.linkActive:{}) }}>{l}</div>
          ))}
        </div>

        {/* Right */}
        <div style={N.right}>
          {/* Status chip */}
          <div style={{ ...N.chip, borderColor: statusColor + "44", background: statusColor + "11" }}>
            <span style={{ ...N.chipDot, background: statusColor, boxShadow: `0 0 6px ${statusColor}`, animation: connStatus==="connected"?"pulse 2s infinite":"none" }} />
            <span style={{ color: statusColor, fontSize:"0.82rem", fontWeight:600 }}>{statusLabel}</span>
          </div>

          {/* Clock */}
          <div style={N.clock}>{time}</div>

          {/* Buttons */}
          {!monitoring && (
            <button style={{ ...N.btn, ...N.btnPrimary, opacity: searching?0.7:1 }}
              onClick={handleStartClick} disabled={searching}>
              {searching ? <><Spin/>Searching…</> : <>▶ Start Monitor</>}
            </button>
          )}
          {monitoring && (
            <button style={{ ...N.btn, ...N.btnDanger }} onClick={onStop}>■ Stop</button>
          )}
          {!monitoring && (
            <button style={{ ...N.btn, ...N.btnGhost, opacity: tryEnabled?1:0.3, cursor: tryEnabled?"pointer":"not-allowed" }}
              onClick={handleTryAgain} disabled={!tryEnabled}>
              ⟳ Retry
            </button>
          )}

          {/* Avatar */}
          <div style={N.avatar}>AG</div>
        </div>
      </nav>

      {/* Popup */}
      {showPopup && (
        <>
          <div style={P.backdrop}/>
          <div style={P.box}>
            <div style={P.iconRing}><span style={{fontSize:"1.8rem"}}>🔌</span></div>
            <div style={P.title}>Arduino Not Detected</div>
            <div style={P.msg}>No Arduino board found. Please check the connection and backend server.</div>
            <div style={P.checks}>
              {["Arduino plugged in via USB","sensor_sender.ino uploaded","Backend server running (npm start)","ARDUINO_PORT set correctly in .env"].map(t=>(
                <div key={t} style={P.checkRow}>
                  <span style={P.checkX}>✕</span>
                  <span style={P.checkText}>{t}</span>
                </div>
              ))}
            </div>
            <div style={P.barWrap}>
              <div style={P.barLabel}>Auto-closing in {popupTimer}s</div>
              <div style={P.barTrack}><div style={{...P.barFill, width:`${(popupTimer/5)*100}%`}}/></div>
            </div>
            <button style={P.closeBtn} onClick={()=>{ clearInterval(countRef.current); setShowPopup(false); setTryEnabled(true); }}>
              Close
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes popIn{from{opacity:0;transform:translate(-50%,-48%) scale(0.88)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
    </>
  );
}

function Spin() {
  return <span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",marginRight:8,verticalAlign:"middle"}}/>;
}

const N = {
  nav:{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:"70px",background:"rgba(6,13,31,0.95)",borderBottom:"1px solid rgba(59,130,246,0.15)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:200,gap:"16px",fontFamily:"'Outfit',sans-serif" },
  brand:{ display:"flex",alignItems:"center",gap:"12px",flexShrink:0 },
  logoBox:{ width:40,height:40,borderRadius:"10px",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",boxShadow:"0 0 20px rgba(59,130,246,0.4)" },
  brandName:{ fontWeight:800,fontSize:"1.15rem",color:"#e2e8f0",letterSpacing:"-0.02em" },
  brandSub:{ fontSize:"0.7rem",color:"#64748b",letterSpacing:"0.05em" },
  links:{ display:"flex",gap:"4px",alignItems:"center" },
  link:{ padding:"6px 14px",borderRadius:"8px",fontSize:"0.85rem",color:"#64748b",cursor:"pointer",fontWeight:500,transition:"all 0.2s" },
  linkActive:{ background:"rgba(59,130,246,0.15)",color:"#60a5fa",fontWeight:600 },
  right:{ display:"flex",alignItems:"center",gap:"10px",flexShrink:0 },
  chip:{ display:"flex",alignItems:"center",gap:"7px",padding:"6px 14px",borderRadius:"20px",border:"1px solid",backdropFilter:"blur(10px)" },
  chipDot:{ width:8,height:8,borderRadius:"50%",flexShrink:0 },
  clock:{ fontSize:"0.82rem",color:"#64748b",fontFamily:"'JetBrains Mono',monospace",minWidth:70,textAlign:"right" },
  btn:{ fontFamily:"'Outfit',sans-serif",fontSize:"0.82rem",fontWeight:600,border:"none",borderRadius:"10px",padding:"8px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",transition:"all 0.2s",whiteSpace:"nowrap" },
  btnPrimary:{ background:"linear-gradient(135deg,#2563eb,#0891b2)",color:"#fff",boxShadow:"0 4px 20px rgba(37,99,235,0.4)" },
  btnDanger:{ background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff" },
  btnGhost:{ background:"rgba(59,130,246,0.08)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.2)" },
  avatar:{ width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:700,color:"#fff",boxShadow:"0 0 0 2px rgba(59,130,246,0.3)" },
};

const P = {
  backdrop:{ position:"fixed",inset:0,background:"rgba(3,7,18,0.8)",backdropFilter:"blur(8px)",zIndex:300 },
  box:{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:400,background:"linear-gradient(135deg,rgba(13,25,60,0.98),rgba(10,20,50,0.98))",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"20px",padding:"36px 40px",width:"min(460px,90vw)",fontFamily:"'Outfit',sans-serif",boxShadow:"0 0 80px rgba(239,68,68,0.15),0 32px 80px rgba(0,0,0,0.6)",animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" },
  iconRing:{ width:64,height:64,borderRadius:"50%",background:"rgba(239,68,68,0.1)",border:"2px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 30px rgba(239,68,68,0.2)" },
  title:{ fontWeight:800,fontSize:"1.3rem",color:"#ef4444",textAlign:"center",marginBottom:"8px" },
  msg:{ fontSize:"0.85rem",color:"#94a3b8",textAlign:"center",lineHeight:1.7,marginBottom:"24px" },
  checks:{ background:"rgba(6,13,31,0.6)",border:"1px solid rgba(59,130,246,0.1)",borderRadius:"12px",padding:"16px 18px",marginBottom:"20px" },
  checkRow:{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px" },
  checkX:{ width:20,height:20,borderRadius:"50%",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",color:"#ef4444",flexShrink:0 },
  checkText:{ fontSize:"0.82rem",color:"#94a3b8" },
  barWrap:{ marginBottom:"20px" },
  barLabel:{ fontSize:"0.72rem",color:"#64748b",marginBottom:"6px",textAlign:"right" },
  barTrack:{ height:"4px",background:"rgba(59,130,246,0.1)",borderRadius:"2px",overflow:"hidden" },
  barFill:{ height:"100%",background:"linear-gradient(90deg,#ef4444,#f59e0b)",borderRadius:"2px",transition:"width 1s linear" },
  closeBtn:{ width:"100%",fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:"0.85rem",background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#60a5fa",borderRadius:"10px",padding:"11px",cursor:"pointer" },
};
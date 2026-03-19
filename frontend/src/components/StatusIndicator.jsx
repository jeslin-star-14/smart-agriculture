// frontend/src/components/StatusIndicator.jsx
import { useEffect, useState } from "react";

export default function StatusIndicator({ status="disconnected", msgRate=0 }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (status==="connected") { const id=setInterval(()=>setPulse(p=>!p),900); return()=>clearInterval(id); }
    setPulse(false);
  }, [status]);

  const colors = { disconnected:"#ef4444", connecting:"#f59e0b", connected:"#10b981" };
  const labels = { disconnected:"Arduino Not Connected", connecting:"Connecting to Arduino…", connected:"Arduino Connected ✓" };
  const color  = colors[status]||colors.disconnected;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"18px",
      background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",
      border:"1px solid rgba(59,130,246,0.15)",
      borderRadius:"16px", padding:"18px 24px", marginBottom:"24px",
      fontFamily:"'Outfit',sans-serif", flexWrap:"wrap",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Pulsing dot */}
      <div style={{position:"relative",width:16,height:16,flexShrink:0}}>
        {status==="connected" && <div style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:pulse?0:0.25,transform:pulse?"scale(3)":"scale(1)",transition:"opacity 0.9s,transform 0.9s"}}/>}
        <div style={{position:"absolute",inset:0,borderRadius:"50%",background:color,boxShadow:`0 0 10px ${color}`}}/>
      </div>

      <div style={{flex:1,minWidth:200}}>
        <div style={{fontWeight:700,fontSize:"1rem",color,marginBottom:"3px"}}>{labels[status]||"Unknown"}</div>
        <div style={{fontSize:"0.8rem",color:"#64748b"}}>
          {status==="disconnected" && "Start your backend server and connect Arduino via USB"}
          {status==="connecting"   && "Opening serial port, please wait…"}
          {status==="connected"    && `Serial port open · 9600 baud · ${msgRate} readings/sec`}
        </div>
      </div>

      {/* Protocol pills */}
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
        {["MQTT","WebSocket","Serial"].map(l=>(
          <div key={l} style={{
            display:"flex",alignItems:"center",gap:"6px",
            fontSize:"0.75rem",fontWeight:600,letterSpacing:"0.04em",
            padding:"5px 14px",borderRadius:"20px",
            background:status==="connected"?"rgba(16,185,129,0.08)":"rgba(59,130,246,0.05)",
            border:`1px solid ${status==="connected"?"rgba(16,185,129,0.25)":"rgba(59,130,246,0.12)"}`,
            color:status==="connected"?"#10b981":"#334155",transition:"all 0.3s",
          }}>
            <span style={{width:6,height:6,borderRadius:"50%",background:status==="connected"?"#10b981":"#1e3a5f",flexShrink:0}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
// frontend/src/components/SensorCard.jsx
export default function SensorCard({ label, value, unit, icon, type }) {
  function getLevel() {
    const v = parseFloat(value);
    if (isNaN(v)) return "normal";
    if (type==="temperature") { if(v>40)return"danger"; if(v>32)return"warn"; }
    if (type==="soil")        { if(v<20)return"danger"; if(v<35)return"warn"; }
    if (type==="humidity")    { if(v<20||v>90)return"warn"; }
    if (type==="ph")          { if(v<5||v>8)return"danger"; if(v<6||v>7.5)return"warn"; }
    return "normal";
  }
  function getPct() {
    const v = parseFloat(value);
    if (isNaN(v)) return 0;
    const r = {temperature:[0,60],humidity:[0,100],soil:[0,100],light:[0,1000],ph:[0,14],rain:[0,1]};
    const [mn,mx] = r[type]||[0,100];
    return Math.min(100,Math.max(0,((v-mn)/(mx-mn))*100));
  }

  const level = getLevel();
  const pct   = getPct();
  const has   = value!=null&&value!=="--"&&value!=="--.-"&&value!=="---"&&value!=="-.-";
  const accent = {normal:"#3b82f6",warn:"#f59e0b",danger:"#ef4444"}[level];
  const glow   = {normal:"rgba(59,130,246,0.2)",warn:"rgba(245,158,11,0.2)",danger:"rgba(239,68,68,0.2)"}[level];
  const display = type==="rain" ? (parseFloat(value)>0?"RAIN":"DRY") : has ? String(value) : "--";

  return (
    <div style={{
      background:"linear-gradient(135deg,rgba(13,25,60,0.9),rgba(10,18,45,0.95))",
      border:`1px solid ${has ? accent+"33" : "rgba(59,130,246,0.1)"}`,
      borderRadius:"16px", padding:"22px 20px",
      position:"relative", overflow:"hidden",
      boxShadow: has ? `0 8px 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : "0 4px 20px rgba(0,0,0,0.3)",
      transition:"all 0.4s", fontFamily:"'Outfit',sans-serif",
      animation:"fadeUp 0.5s ease both",
    }}>
      {/* Glow orb */}
      {has && <div style={{ position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:glow,filter:"blur(20px)",pointerEvents:"none" }}/>}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
        <div>
          <div style={{fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.12em",color:"#64748b",fontWeight:600,marginBottom:"2px"}}>{label}</div>
          <div style={{fontSize:"0.68rem",color:has?accent+"99":"#334155"}}>{has?"● Live":"○ Waiting"}</div>
        </div>
        <div style={{fontSize:"1.6rem",opacity:has?1:0.4}}>{icon}</div>
      </div>

      {/* Value */}
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"2.4rem",fontWeight:600,color:has?accent:"#334155",lineHeight:1,marginBottom:"4px",letterSpacing:"-0.02em"}}>
        {display}
      </div>
      <div style={{fontSize:"0.78rem",color:"#64748b",fontWeight:500,marginBottom:"16px"}}>{type==="rain"?"status":unit}</div>

      {/* Bar */}
      <div style={{height:"3px",background:"rgba(59,130,246,0.08)",borderRadius:"2px",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${accent},${accent}99)`,borderRadius:"2px",boxShadow:`0 0 8px ${accent}66`,transition:"width 0.9s ease"}}/>
      </div>
    </div>
  );
}
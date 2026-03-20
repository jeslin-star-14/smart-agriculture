// frontend/src/pages/SensorsPage.jsx — NEW FILE
// Place at: frontend/src/pages/SensorsPage.jsx

export default function SensorsPage({ sensorData, connStatus, monitoring }) {
  const SENSORS = [
    { key:"temperature",  label:"Temperature",    icon:"🌡", unit:"°C",    type:"temperature",  desc:"Measures ambient air temperature around crops", range:"15°C – 45°C optimal", min:0,  max:60  },
    { key:"humidity",     label:"Air Humidity",    icon:"💧", unit:"% RH", type:"humidity",     desc:"Relative humidity of the air above the field",   range:"40% – 80% optimal",  min:0,  max:100 },
    { key:"soilMoisture", label:"Soil Moisture",   icon:"🌱", unit:"%",    type:"soil",         desc:"Volumetric water content in the soil",           range:"30% – 60% optimal",  min:0,  max:100 },
    { key:"light",        label:"Light Intensity", icon:"☀️", unit:"lux",  type:"light",        desc:"Ambient light level for photosynthesis tracking", range:"200 – 800 lux optimal",min:0, max:1000},
    { key:"ph",           label:"Soil pH",         icon:"⚗️", unit:"pH",   type:"ph",           desc:"Acidity/alkalinity of the soil",                 range:"6.0 – 7.5 optimal",  min:0,  max:14  },
    { key:"rain",         label:"Rain Sensor",     icon:"🌧", unit:"",     type:"rain",         desc:"Detects presence of rainfall or moisture on sensor","range":"DRY / RAIN",       min:0,  max:1   },
  ];

  function getLevel(type, value) {
    const v = parseFloat(value);
    if (isNaN(v)) return "idle";
    if (type==="temperature") { if(v>40)return"danger"; if(v>32)return"warn"; }
    if (type==="soil")        { if(v<20)return"danger"; if(v<35)return"warn"; }
    if (type==="humidity")    { if(v<20||v>90)return"warn"; }
    if (type==="ph")          { if(v<5||v>8)return"danger"; if(v<6||v>7.5)return"warn"; }
    return "good";
  }

  function getPct(s, value) {
    const v = parseFloat(value); if(isNaN(v)) return 0;
    return Math.min(100,Math.max(0,((v-s.min)/(s.max-s.min))*100));
  }

  const colors = { good:"#10b981", warn:"#f59e0b", danger:"#ef4444", idle:"#334155" };
  const labels = { good:"Normal", warn:"Warning", danger:"Critical", idle:"No Data" };

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={hdr.row}>
        <div>
          <div style={hdr.tag}>Live Sensor Readings</div>
          <h2 style={hdr.h2}>All Sensors</h2>
        </div>
        <div style={{fontSize:"0.8rem",color:"#475569",display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:monitoring?"#10b981":"#334155",display:"inline-block",boxShadow:monitoring?"0 0 6px #10b981":"none"}}/>
          {monitoring ? "Live feed active" : "Start monitoring to see readings"}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{display:"flex",gap:"12px",marginBottom:"28px",flexWrap:"wrap"}}>
        {["Total Sensors","Online","Warning","Critical"].map((l,i)=>{
          const vals = [6, monitoring?6:0, SENSORS.filter(s=>getLevel(s.type,sensorData[s.key])==="warn").length, SENSORS.filter(s=>getLevel(s.type,sensorData[s.key])==="danger").length];
          const cols = ["#3b82f6","#10b981","#f59e0b","#ef4444"];
          return (
            <div key={l} style={{flex:1,minWidth:120,background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:`1px solid ${cols[i]}22`,borderRadius:"14px",padding:"16px 18px"}}>
              <div style={{fontSize:"0.7rem",color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"}}>{l}</div>
              <div style={{fontSize:"1.8rem",fontWeight:800,color:cols[i],fontFamily:"'JetBrains Mono',monospace"}}>{vals[i]}</div>
            </div>
          );
        })}
      </div>

      {/* Sensor detail cards */}
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {SENSORS.map(s=>{
          const rawVal = sensorData[s.key];
          const level  = getLevel(s.type, rawVal);
          const pct    = getPct(s, rawVal);
          const color  = colors[level];
          const has    = rawVal && rawVal!=="--" && rawVal!=="--.-" && rawVal!=="---" && rawVal!=="-.-";
          const display = s.type==="rain" ? (parseFloat(rawVal)>0?"🌧 RAIN DETECTED":"✅ DRY") : has ? `${rawVal} ${s.unit}` : "-- No Data";

          return (
            <div key={s.key} style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:`1px solid ${has?color+"33":"rgba(59,130,246,0.08)"}`,borderRadius:"16px",padding:"22px 24px",display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap",boxShadow:has?`0 4px 24px ${color}11`:"none",transition:"all 0.3s"}}>
              {/* Icon */}
              <div style={{width:56,height:56,borderRadius:"14px",background:`${color}15`,border:`1px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",flexShrink:0}}>
                {s.icon}
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontWeight:700,fontSize:"1rem",color:"#e2e8f0",marginBottom:"2px"}}>{s.label}</div>
                <div style={{fontSize:"0.75rem",color:"#64748b",marginBottom:"10px"}}>{s.desc}</div>
                {/* Bar */}
                {s.type !== "rain" && (
                  <div style={{height:"4px",background:"rgba(59,130,246,0.08)",borderRadius:"2px",overflow:"hidden",width:"100%",maxWidth:300}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:"2px",transition:"width 0.9s ease",boxShadow:`0 0 8px ${color}55`}}/>
                  </div>
                )}
              </div>

              {/* Value */}
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"1.6rem",fontWeight:700,color:has?color:"#334155",marginBottom:"4px"}}>{display}</div>
                <div style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"flex-end"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:color,boxShadow:has?`0 0 6px ${color}`:"none"}}/>
                  <span style={{fontSize:"0.75rem",color,fontWeight:600}}>{labels[level]}</span>
                </div>
                <div style={{fontSize:"0.68rem",color:"#475569",marginTop:"4px"}}>{s.range}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const hdr = {
  row:{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"},
  tag:{fontSize:"0.7rem",color:"#3b82f6",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"},
  h2:{fontSize:"1.8rem",fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",lineHeight:1},
};
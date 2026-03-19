// frontend/src/components/SensorChart.jsx
import { useEffect, useRef, useState } from "react";

const METRICS = ["temperature","humidity","soil","light"];
const LABELS  = { temperature:"Temperature °C", humidity:"Humidity %", soil:"Soil Moisture %", light:"Light lux" };
const RANGES  = { temperature:[0,60], humidity:[0,100], soil:[0,100], light:[0,1000] };
const COLORS  = { temperature:"#ef4444", humidity:"#3b82f6", soil:"#10b981", light:"#f59e0b" };

export default function SensorChart({ sensorData }) {
  const canvasRef    = useRef(null);
  const [metric, setMetric] = useState("temperature");
  const histRef      = useRef({ temperature:[], humidity:[], soil:[], light:[], labels:[] });

  useEffect(() => {
    if (!sensorData) return;
    const now = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const h = histRef.current;
    h.labels.push(now);
    h.temperature.push(parseFloat(sensorData.temperature)||0);
    h.humidity.push(parseFloat(sensorData.humidity)||0);
    h.soil.push(parseFloat(sensorData.soilMoisture||sensorData.soil)||0);
    h.light.push(parseFloat(sensorData.light)||0);
    if (h.labels.length>60) { h.labels.shift(); METRICS.forEach(m=>h[m].shift()); }
    draw();
  }, [sensorData]);

  useEffect(() => { draw(); }, [metric]);
  useEffect(() => { window.addEventListener("resize",draw); return()=>window.removeEventListener("resize",draw); }, [metric]);

  function draw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = cv.width = cv.offsetWidth;
    const H = cv.height = 230;
    const ctx = cv.getContext("2d");
    const data = histRef.current[metric];
    const color = COLORS[metric];

    ctx.clearRect(0,0,W,H);

    // BG
    ctx.fillStyle = "rgba(6,13,31,0)";
    ctx.fillRect(0,0,W,H);

    // Grid lines
    for (let i=0;i<=4;i++) {
      const y = 20+(i/4)*(H-44);
      ctx.strokeStyle = "rgba(59,130,246,0.07)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(50,y); ctx.lineTo(W-10,y); ctx.stroke();
    }

    if (data.length<2) {
      ctx.fillStyle="#334155"; ctx.font="14px Outfit,sans-serif";
      ctx.textAlign="center";
      ctx.fillText("Waiting for live data…",W/2,H/2);
      return;
    }

    const [mn,mx] = RANGES[metric];
    const range = mx-mn||1;
    const xStep = (W-60)/(data.length-1);
    const toX = i => 50+i*xStep;
    const toY = v => H-24-((v-mn)/range)*(H-48);

    // Gradient fill
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, color+"44");
    grad.addColorStop(1, color+"00");
    ctx.beginPath();
    ctx.moveTo(toX(0),toY(data[0]));
    data.forEach((v,i)=>i>0&&ctx.lineTo(toX(i),toY(v)));
    ctx.lineTo(toX(data.length-1),H-24);
    ctx.lineTo(toX(0),H-24);
    ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();

    // Line with glow
    ctx.shadowColor=color; ctx.shadowBlur=8;
    ctx.beginPath();
    ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.lineJoin="round";
    ctx.moveTo(toX(0),toY(data[0]));
    data.forEach((v,i)=>i>0&&ctx.lineTo(toX(i),toY(v)));
    ctx.stroke();
    ctx.shadowBlur=0;

    // Last dot
    const lx=toX(data.length-1), ly=toY(data[data.length-1]);
    ctx.beginPath(); ctx.arc(lx,ly,5,0,Math.PI*2);
    ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=12; ctx.fill();
    ctx.shadowBlur=0;

    // Y labels
    ctx.fillStyle="#475569"; ctx.font="11px JetBrains Mono,monospace"; ctx.textAlign="right";
    for(let i=0;i<=4;i++) {
      const v=mn+(i/4)*range;
      ctx.fillText(v.toFixed(0),46,H-24-(i/4)*(H-48)+4);
    }
  }

  return (
    <div style={{
      background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",
      border:"1px solid rgba(59,130,246,0.15)",
      borderRadius:"16px",overflow:"hidden",marginBottom:"24px",
      fontFamily:"'Outfit',sans-serif",
      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{padding:"18px 22px",borderBottom:"1px solid rgba(59,130,246,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px"}}>
        <div>
          <div style={{fontWeight:700,fontSize:"1rem",color:"#e2e8f0"}}>Live Graph</div>
          <div style={{fontSize:"0.72rem",color:"#64748b",marginTop:"2px"}}>{LABELS[metric]}</div>
        </div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {METRICS.map(m=>(
            <button key={m} onClick={()=>setMetric(m)} style={{
              fontFamily:"'Outfit',sans-serif",fontSize:"0.78rem",fontWeight:600,
              padding:"6px 14px",borderRadius:"8px",cursor:"pointer",transition:"all 0.2s",border:"none",
              background: metric===m ? `linear-gradient(135deg,${COLORS[m]},${COLORS[m]}99)` : "rgba(59,130,246,0.07)",
              color: metric===m ? "#fff" : "#64748b",
              boxShadow: metric===m ? `0 4px 16px ${COLORS[m]}44` : "none",
            }}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{display:"block",width:"100%",height:"230px"}}/>
    </div>
  );
}
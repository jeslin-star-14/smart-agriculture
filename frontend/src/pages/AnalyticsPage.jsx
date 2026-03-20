// frontend/src/pages/AnalyticsPage.jsx — NEW FILE
// Place at: frontend/src/pages/AnalyticsPage.jsx

import { useEffect, useRef, useState } from "react";

const METRICS = [
  { key:"temperature",  label:"Temperature", unit:"°C",   color:"#ef4444", range:[0,60]   },
  { key:"humidity",     label:"Humidity",    unit:"%",    color:"#3b82f6", range:[0,100]  },
  { key:"soilMoisture", label:"Soil",        unit:"%",    color:"#10b981", range:[0,100]  },
  { key:"light",        label:"Light",       unit:"lux",  color:"#f59e0b", range:[0,1000] },
  { key:"ph",           label:"pH",          unit:"",     color:"#8b5cf6", range:[0,14]   },
];

export default function AnalyticsPage({ sensorHistory }) {
  const [activeMetric, setActiveMetric] = useState("temperature");
  const [chartType, setChartType]       = useState("line"); // line | bar
  const canvasRef = useRef(null);
  const histRef   = useRef({ temperature:[], humidity:[], soilMoisture:[], light:[], ph:[], labels:[] });

  // Build history from props
  useEffect(() => {
    if (!sensorHistory?.length) return;
    const h = histRef.current;
    h.labels        = sensorHistory.map(r=>new Date(r.createdAt||Date.now()).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
    h.temperature   = sensorHistory.map(r=>parseFloat(r.temperature)||0);
    h.humidity      = sensorHistory.map(r=>parseFloat(r.humidity)||0);
    h.soilMoisture  = sensorHistory.map(r=>parseFloat(r.soilMoisture)||0);
    h.light         = sensorHistory.map(r=>parseFloat(r.light)||0);
    h.ph            = sensorHistory.map(r=>parseFloat(r.ph)||0);
    drawChart();
  }, [sensorHistory, activeMetric, chartType]);

  useEffect(() => { drawChart(); }, [activeMetric, chartType]);
  useEffect(() => { window.addEventListener("resize", drawChart); return()=>window.removeEventListener("resize",drawChart); }, [activeMetric, chartType]);

  function drawChart() {
    const cv = canvasRef.current; if(!cv) return;
    const W = cv.width = cv.offsetWidth;
    const H = cv.height = 280;
    const ctx = cv.getContext("2d");
    const m   = METRICS.find(x=>x.key===activeMetric);
    const data = histRef.current[activeMetric];
    const color = m.color;

    ctx.clearRect(0,0,W,H);

    // Grid
    for(let i=0;i<=4;i++){
      const y = 24+(i/4)*(H-48);
      ctx.strokeStyle="rgba(59,130,246,0.07)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(W-10,y); ctx.stroke();
    }

    if(data.length<2){
      ctx.fillStyle="#334155"; ctx.font="14px Outfit,sans-serif"; ctx.textAlign="center";
      ctx.fillText("No analytics data yet. Connect Arduino and monitor to collect data.",W/2,H/2);
      return;
    }

    const [mn,mx]=m.range; const range=mx-mn||1;
    const xStep=(W-70)/(data.length-1);
    const toX=i=>60+i*xStep;
    const toY=v=>H-24-((v-mn)/range)*(H-52);

    if(chartType==="line"){
      // Fill
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,color+"55"); grad.addColorStop(1,color+"00");
      ctx.beginPath(); ctx.moveTo(toX(0),toY(data[0]));
      data.forEach((v,i)=>i>0&&ctx.lineTo(toX(i),toY(v)));
      ctx.lineTo(toX(data.length-1),H-24); ctx.lineTo(toX(0),H-24); ctx.closePath();
      ctx.fillStyle=grad; ctx.fill();
      // Line
      ctx.shadowColor=color; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.lineJoin="round";
      ctx.moveTo(toX(0),toY(data[0]));
      data.forEach((v,i)=>i>0&&ctx.lineTo(toX(i),toY(v))); ctx.stroke();
      ctx.shadowBlur=0;
      // Dots on last 5
      data.slice(-5).forEach((_,ri)=>{
        const i=data.length-5+ri;
        ctx.beginPath(); ctx.arc(toX(i),toY(data[i]),4,0,Math.PI*2);
        ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
      });
    } else {
      // Bar chart
      const bw = Math.max(4, xStep*0.6);
      data.forEach((v,i)=>{
        const x=toX(i)-bw/2; const y=toY(v); const h2=H-24-y;
        const grad2=ctx.createLinearGradient(0,y,0,H-24);
        grad2.addColorStop(0,color); grad2.addColorStop(1,color+"33");
        ctx.fillStyle=grad2;
        ctx.shadowColor=color; ctx.shadowBlur=6;
        ctx.beginPath();
        const r=4;
        ctx.moveTo(x+r,y); ctx.lineTo(x+bw-r,y);
        ctx.quadraticCurveTo(x+bw,y,x+bw,y+r);
        ctx.lineTo(x+bw,H-24); ctx.lineTo(x,H-24); ctx.lineTo(x,y+r);
        ctx.quadraticCurveTo(x,y,x+r,y);
        ctx.fill(); ctx.shadowBlur=0;
      });
    }

    // Y axis labels
    ctx.fillStyle="#475569"; ctx.font="11px JetBrains Mono,monospace"; ctx.textAlign="right";
    for(let i=0;i<=4;i++){
      const v=mn+(i/4)*range;
      ctx.fillText(v.toFixed(0),56,H-24-(i/4)*(H-52)+4);
    }

    // X axis — every Nth label
    const step = Math.max(1,Math.floor(data.length/8));
    ctx.fillStyle="#334155"; ctx.font="10px JetBrains Mono,monospace"; ctx.textAlign="center";
    histRef.current.labels.forEach((l,i)=>{
      if(i%step===0) ctx.fillText(l,toX(i),H-6);
    });
  }

  // Stats
  function stats(key) {
    const arr = histRef.current[key].filter(v=>!isNaN(v)&&v!==0);
    if(!arr.length) return {min:"--",max:"--",avg:"--",cnt:0};
    return {
      min: Math.min(...arr).toFixed(1),
      max: Math.max(...arr).toFixed(1),
      avg: (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1),
      cnt: arr.length,
    };
  }

  const active = METRICS.find(x=>x.key===activeMetric);
  const st = stats(activeMetric);

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <div style={A.tag}>Visual Analytics</div>
          <h2 style={A.h2}>Sensor Analytics</h2>
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          {["line","bar"].map(t=>(
            <button key={t} onClick={()=>setChartType(t)} style={{...A.typeBtn,...(chartType===t?{background:"linear-gradient(135deg,#2563eb,#0891b2)",color:"#fff",border:"none",boxShadow:"0 4px 16px rgba(37,99,235,0.3)"}:{})}}>
              {t==="line"?"📈 Line":"📊 Bar"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric tabs */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
        {METRICS.map(m=>(
          <button key={m.key} onClick={()=>setActiveMetric(m.key)} style={{
            fontFamily:"'Outfit',sans-serif",fontSize:"0.82rem",fontWeight:600,
            padding:"8px 18px",borderRadius:"10px",cursor:"pointer",border:"none",transition:"all 0.2s",
            background:activeMetric===m.key?`linear-gradient(135deg,${m.color},${m.color}99)`:"rgba(59,130,246,0.07)",
            color:activeMetric===m.key?"#fff":"#64748b",
            boxShadow:activeMetric===m.key?`0 4px 16px ${m.color}44`:"none",
          }}>{m.label} {m.unit&&<span style={{opacity:0.7}}>({m.unit})</span>}</button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"12px",marginBottom:"20px"}}>
        {[{l:"Min",v:`${st.min} ${active.unit}`},{l:"Max",v:`${st.max} ${active.unit}`},{l:"Average",v:`${st.avg} ${active.unit}`},{l:"Readings",v:st.cnt}].map(({l,v})=>(
          <div key={l} style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:`1px solid ${active.color}22`,borderRadius:"14px",padding:"16px 18px"}}>
            <div style={{fontSize:"0.68rem",color:"#64748b",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"}}>{l}</div>
            <div style={{fontSize:"1.4rem",fontWeight:800,color:active.color,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:"16px",overflow:"hidden",padding:"0 0 4px"}}>
        <div style={{padding:"18px 22px 12px",borderBottom:"1px solid rgba(59,130,246,0.08)",display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:active.color,boxShadow:`0 0 10px ${active.color}`}}/>
          <span style={{fontWeight:700,fontSize:"0.95rem",color:"#e2e8f0"}}>{active.label} over time</span>
          <span style={{fontSize:"0.72rem",color:"#475569",marginLeft:"auto"}}>{histRef.current[activeMetric].length} data points</span>
        </div>
        <canvas ref={canvasRef} style={{display:"block",width:"100%",height:"280px"}}/>
      </div>

      {/* All sensors mini summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"12px",marginTop:"20px"}}>
        {METRICS.map(m=>{
          const s=stats(m.key);
          return (
            <div key={m.key} onClick={()=>setActiveMetric(m.key)} style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:`1px solid ${activeMetric===m.key?m.color+"55":"rgba(59,130,246,0.1)"}`,borderRadius:"14px",padding:"16px",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontSize:"0.72rem",color:"#64748b",fontWeight:600,textTransform:"uppercase",marginBottom:"8px"}}>{m.label}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",fontFamily:"'JetBrains Mono',monospace"}}>
                <span style={{color:"#3b82f6"}}>↓{s.min}</span>
                <span style={{color:m.color,fontWeight:700}}>~{s.avg}</span>
                <span style={{color:"#ef4444"}}>↑{s.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const A = {
  tag:{fontSize:"0.7rem",color:"#3b82f6",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"},
  h2:{fontSize:"1.8rem",fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",lineHeight:1},
  typeBtn:{fontFamily:"'Outfit',sans-serif",fontSize:"0.82rem",fontWeight:600,padding:"8px 16px",borderRadius:"10px",cursor:"pointer",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.18)",color:"#64748b",transition:"all 0.2s"},
};
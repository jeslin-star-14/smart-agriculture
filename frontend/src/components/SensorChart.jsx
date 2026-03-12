// frontend/src/components/SensorChart.jsx
import { useEffect, useRef, useState } from "react";

const METRICS = ["temperature", "humidity", "soil", "light"];
const METRIC_LABELS = { temperature: "Temp °C", humidity: "Humidity %", soil: "Soil %", light: "Light lux" };
const METRIC_RANGES = { temperature: [0, 60], humidity: [0, 100], soil: [0, 100], light: [0, 1000] };

export default function SensorChart({ sensorData }) {
  const canvasRef = useRef(null);
  const [activeMetric, setActiveMetric] = useState("temperature");
  const historyRef = useRef({ temperature: [], humidity: [], soil: [], light: [], labels: [] });

  useEffect(() => {
    if (!sensorData) return;
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const h = historyRef.current;
    h.labels.push(now);
    h.temperature.push(parseFloat(sensorData.temperature) || 0);
    h.humidity.push(parseFloat(sensorData.humidity) || 0);
    h.soil.push(parseFloat(sensorData.soilMoisture ?? sensorData.soil) || 0);
    h.light.push(parseFloat(sensorData.light) || 0);
    if (h.labels.length > 60) {
      h.labels.shift();
      METRICS.forEach(m => h[m].shift());
    }
    drawChart();
  }, [sensorData]);

  useEffect(() => { drawChart(); }, [activeMetric]);

  function drawChart() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 220;
    const ctx = canvas.getContext("2d");
    const data = historyRef.current[activeMetric];

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#111a14";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#1e3326"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 24 + (i / 4) * (H - 48);
      ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 10, y); ctx.stroke();
    }

    if (data.length < 2) {
      ctx.fillStyle = "#2e5a3a";
      ctx.font = "15px Space Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for live data…", W / 2, H / 2);
      return;
    }

    const [minV, maxV] = METRIC_RANGES[activeMetric];
    const range = maxV - minV || 1;
    const xStep = (W - 60) / (data.length - 1);
    const toX = i => 50 + i * xStep;
    const toY = v => H - 24 - ((v - minV) / range) * (H - 48);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(0,255,127,0.28)");
    grad.addColorStop(1, "rgba(0,255,127,0)");
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => i > 0 && ctx.lineTo(toX(i), toY(v)));
    ctx.lineTo(toX(data.length - 1), H - 24);
    ctx.lineTo(toX(0), H - 24);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "#00ff7f"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => i > 0 && ctx.lineTo(toX(i), toY(v)));
    ctx.stroke();

    const lx = toX(data.length - 1), ly = toY(data[data.length - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff7f"; ctx.fill();

    ctx.fillStyle = "#4a7a58"; ctx.font = "12px Space Mono, monospace"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const v = minV + (i / 4) * range;
      const y = H - 24 - (i / 4) * (H - 48);
      ctx.fillText(v.toFixed(0), 46, y + 4);
    }
  }

  useEffect(() => {
    window.addEventListener("resize", drawChart);
    return () => window.removeEventListener("resize", drawChart);
  }, [activeMetric]);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Live Graph</span>
        <div style={tabsStyle}>
          {METRICS.map(m => (
            <button
              key={m}
              style={{ ...tabStyle, ...(activeMetric === m ? tabActiveStyle : {}) }}
              onClick={() => setActiveMetric(m)}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "220px" }} />
    </div>
  );
}

const panelStyle = {
  background: "#111a14", border: "1px solid #1e3326",
  borderRadius: "12px", overflow: "hidden",
  marginBottom: "28px", fontFamily: "'Space Mono', monospace",
};
const headerStyle = {
  padding: "16px 22px", borderBottom: "1px solid #1e3326",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  flexWrap: "wrap", gap: "10px",
};
const titleStyle = {
  fontFamily: "'Syne', sans-serif", fontWeight: 700,
  fontSize: "1.05rem", color: "#d4edd9",
};
const tabsStyle = { display: "flex", gap: "8px", flexWrap: "wrap" };
const tabStyle = {
  fontFamily: "'Space Mono', monospace", fontSize: "0.78rem",
  padding: "6px 14px", borderRadius: "6px",
  background: "transparent", border: "1px solid #1e3326",
  color: "#4a7a58", cursor: "pointer", transition: "all 0.2s", fontWeight: 700,
};
const tabActiveStyle = {
  background: "#00ff7f", color: "#040f08",
  borderColor: "#00ff7f",
};
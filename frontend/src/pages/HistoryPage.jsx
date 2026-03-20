// frontend/src/pages/HistoryPage.jsx
import { useState, useEffect } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export default function HistoryPage() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hours, setHours]       = useState(24);
  const [limit, setLimit]       = useState(50);
  const [search, setSearch]     = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [error, setError]       = useState("");

  useEffect(() => { fetchHistory(); }, [hours, limit]);

  async function fetchHistory() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("agri_token");
      const res = await fetch(
        `${BACKEND}/api/sensors/history?hours=${hours}&limit=${limit}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setHistory(data.data || []);

      // No data yet — show helpful message
      if (!data.data || data.data.length === 0) {
        setError("no_data");
      }
    } catch (err) {
      if (err.message === "no_data" || err.message === "No sensor data found yet") {
        setError("no_data");
      } else {
        setError("Cannot connect to backend. Make sure backend is running on port 5001.");
      }
      setHistory([]);
    }
    setLoading(false);
  }

  function exportPDF() {
    if (filtered.length === 0) { alert("No data to export. Connect Arduino and start monitoring first."); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    let rows = "";
    filtered.forEach(r => {
      rows += "<tr>" +
        "<td>" + new Date(r.createdAt).toLocaleString() + "</td>" +
        "<td>" + r.temperature + "°C</td>" +
        "<td>" + r.humidity + "%</td>" +
        "<td>" + r.soilMoisture + "%</td>" +
        "<td>" + r.light + " lux</td>" +
        "<td>" + r.ph + "</td>" +
        "<td>" + (r.rain > 0 ? "Rain" : "Dry") + "</td>" +
        "</tr>";
    });
    win.document.write(
      "<!DOCTYPE html><html><head><title>AgriSense History</title>" +
      "<style>body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}" +
      "h1{color:#1d4ed8}p{color:#64748b;font-size:13px;margin-bottom:24px}" +
      "table{width:100%;border-collapse:collapse;font-size:12px}" +
      "th{background:#1d4ed8;color:#fff;padding:10px 12px;text-align:left}" +
      "td{padding:9px 12px;border-bottom:1px solid #e2e8f0}" +
      "tr:nth-child(even){background:#f8fafc}" +
      ".footer{margin-top:32px;font-size:11px;color:#94a3b8}</style></head><body>" +
      "<h1>🌿 AgriSense — Arduino Sensor History</h1>" +
      "<p>Generated: " + new Date().toLocaleString() + " · Last " + hours + "h · " + filtered.length + " records from Arduino</p>" +
      "<table><thead><tr><th>Timestamp</th><th>Temp</th><th>Humidity</th><th>Soil</th><th>Light</th><th>pH</th><th>Rain</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table>" +
      "<div class='footer'>Data source: Arduino sensors via USB serial connection</div>" +
      "</body></html>"
    );
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  function exportCSV() {
    if (filtered.length === 0) { alert("No data to export."); return; }
    let content = "Timestamp,Temperature(C),Humidity(%),Soil Moisture(%),Light(lux),pH,Rain\n";
    filtered.forEach(r => {
      content += new Date(r.createdAt).toLocaleString() + "," +
        r.temperature + "," + r.humidity + "," + r.soilMoisture + "," +
        r.light + "," + r.ph + "," + (r.rain > 0 ? "Rain" : "Dry") + "\n";
    });
    const blob = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agrisense_arduino_data.csv";
    a.click();
  }

  const filtered = history.filter(r =>
    !search || Object.values(r).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const COLS = ["Timestamp", "Temp °C", "Humidity %", "Soil %", "Light lux", "pH", "Rain"];

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:"0.7rem", color:"#3b82f6", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>
            Arduino Sensor Data
          </div>
          <h2 style={{ fontSize:"1.8rem", fontWeight:800, color:"#e2e8f0", letterSpacing:"-0.02em", lineHeight:1 }}>
            Sensor History Log
          </h2>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={exportCSV} style={B.csv}>⬇ CSV</button>
          <button onClick={exportPDF} style={B.pdf}>📄 Export PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search readings…"
          style={B.input}
        />
        <select value={hours} onChange={e => setHours(Number(e.target.value))} style={B.select}>
          <option value={1}>Last 1 hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
        </select>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={B.select}>
          <option value={25}>25 records</option>
          <option value={50}>50 records</option>
          <option value={100}>100 records</option>
          <option value={200}>200 records</option>
        </select>
        <button onClick={fetchHistory} style={B.refresh}>⟳ Refresh</button>
        <span style={{ fontSize:"0.78rem", color:"#475569", marginLeft:"auto" }}>
          {filtered.length} records
        </span>
      </div>

      {/* No data / error state */}
      {!loading && error === "no_data" && (
        <div style={{ background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))", border:"1px solid rgba(59,130,246,0.15)", borderRadius:16, padding:"60px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"3rem", marginBottom:16 }}>🔌</div>
          <div style={{ fontSize:"1.2rem", fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>
            No Arduino Data Yet
          </div>
          <div style={{ fontSize:"0.85rem", color:"#64748b", lineHeight:1.7, maxWidth:400, margin:"0 auto 24px" }}>
            History will appear here once your Arduino is connected and starts sending sensor readings.
          </div>
          <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:12, padding:"16px 20px", display:"inline-block", textAlign:"left" }}>
            <div style={{ fontSize:"0.8rem", color:"#64748b", fontFamily:"'JetBrains Mono',monospace", lineHeight:2 }}>
              <div>1. Upload <strong style={{color:"#60a5fa"}}>sensor_sender.ino</strong> to Arduino</div>
              <div>2. Set <strong style={{color:"#60a5fa"}}>ARDUINO_PORT</strong> in backend/.env</div>
              <div>3. Restart backend: <strong style={{color:"#60a5fa"}}>npm run dev</strong></div>
              <div>4. Click <strong style={{color:"#10b981"}}>▶ Start Monitor</strong> on Dashboard</div>
            </div>
          </div>
        </div>
      )}

      {!loading && error && error !== "no_data" && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:"20px 24px", color:"#fca5a5", fontSize:"0.85rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      {!error && (
        <div style={{ background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))", border:"1px solid rgba(59,130,246,0.12)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Outfit',sans-serif" }}>
              <thead>
                <tr style={{ background:"rgba(37,99,235,0.12)", borderBottom:"1px solid rgba(59,130,246,0.15)" }}>
                  {COLS.map(c => (
                    <th key={c} style={{ padding:"14px 16px", textAlign:"left", fontSize:"0.72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} style={{ padding:"60px", textAlign:"center", color:"#475569", fontSize:"0.9rem" }}>
                      Loading Arduino data…
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} style={{ padding:"60px", textAlign:"center", color:"#475569", fontSize:"0.9rem" }}>
                      No records found for this time period.
                    </td>
                  </tr>
                )}

                {!loading && filtered.map((r, i) => {
                  const ts      = new Date(r.createdAt);
                  const isRain  = r.rain > 0;
                  const isHov   = hoveredRow === i;
                  const isEven  = i % 2 === 0;
                  const tempNum = parseFloat(r.temperature);
                  let tempColor = "#e2e8f0";
                  if (tempNum > 40) tempColor = "#ef4444";
                  else if (tempNum > 32) tempColor = "#f59e0b";

                  return (
                    <tr
                      key={r._id || i}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom:"1px solid rgba(59,130,246,0.06)", background: isHov ? "rgba(59,130,246,0.09)" : isEven ? "transparent" : "rgba(59,130,246,0.02)", transition:"background 0.15s" }}
                    >
                      <td style={T.td}>
                        <div style={{ color:"#94a3b8", fontSize:"0.75rem", fontFamily:"'JetBrains Mono',monospace" }}>{ts.toLocaleDateString()}</div>
                        <div style={{ color:"#64748b", fontSize:"0.75rem", fontFamily:"'JetBrains Mono',monospace" }}>{ts.toLocaleTimeString()}</div>
                      </td>
                      <td style={T.td}><span style={{ color:tempColor, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{r.temperature}°C</span></td>
                      <td style={T.td}><span style={{ color:"#3b82f6", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{r.humidity}%</span></td>
                      <td style={T.td}><span style={{ color:"#10b981", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{r.soilMoisture}%</span></td>
                      <td style={T.td}><span style={{ color:"#f59e0b", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{r.light}</span></td>
                      <td style={T.td}><span style={{ color:"#8b5cf6", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{r.ph}</span></td>
                      <td style={T.td}>
                        <span style={{ padding:"3px 10px", borderRadius:"20px", fontSize:"0.72rem", fontWeight:700, background: isRain ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)", border: isRain ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(16,185,129,0.3)", color: isRain ? "#60a5fa" : "#10b981" }}>
                          {isRain ? "🌧 Rain" : "✅ Dry"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  td: { padding:"12px 16px", fontSize:"0.85rem" },
};

const B = {
  input:{ background:"rgba(6,13,31,0.8)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"9px 14px", color:"#e2e8f0", fontSize:"0.85rem", outline:"none", fontFamily:"'Outfit',sans-serif", minWidth:220 },
  select:{ background:"rgba(6,13,31,0.8)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"9px 12px", color:"#e2e8f0", fontSize:"0.82rem", outline:"none", fontFamily:"'Outfit',sans-serif", cursor:"pointer" },
  refresh:{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.18)", color:"#60a5fa", borderRadius:10, padding:"9px 16px", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" },
  csv:{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", color:"#10b981", borderRadius:10, padding:"9px 16px", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" },
  pdf:{ background:"linear-gradient(135deg,#2563eb,#0891b2)", border:"none", color:"#fff", borderRadius:10, padding:"9px 18px", fontSize:"0.82rem", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:"0 4px 16px rgba(37,99,235,0.3)" },
};
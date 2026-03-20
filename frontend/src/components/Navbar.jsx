// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";

export default function Navbar({ connStatus, monitoring, onStart, onStop, onRetry, user, onLogout, activePage, onPageChange, cloudMode, onConnect }) {
  const [time, setTime]               = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [showPopup, setShowPopup]     = useState(false);
  const [popupTimer, setPopupTimer]   = useState(5);
  const [tryEnabled, setTryEnabled]   = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // When connected while searching — stop spinner
  useEffect(() => {
    if (connStatus === "connected" && connecting) {
      setConnecting(false);
    }
  }, [connStatus]);

  // ── Connect button clicked ─────────────────────────────────
  async function handleConnect() {
    setConnecting(true);
    setTryEnabled(false);
    onConnect && onConnect(); // tell App to retry socket / arduino check

    // Wait 4 seconds for response
    setTimeout(() => {
      setConnecting(false);
      if (connStatus !== "connected") {
        triggerPopup();
      }
    }, 4000);
  }

  function triggerPopup() {
    setShowPopup(true);
    setPopupTimer(5);
    setTryEnabled(false);
    let r = 5;
    countRef.current = setInterval(() => {
      r--;
      setPopupTimer(r);
      if (r <= 0) {
        clearInterval(countRef.current);
        setShowPopup(false);
        setTryEnabled(true);
      }
    }, 1000);
  }

  useEffect(() => () => clearInterval(countRef.current), []);

  const statusColor = {
    disconnected: "#ef4444",
    connecting:   "#f59e0b",
    connected:    "#22c55e",
  }[connStatus] || "#ef4444";

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "AG";

  const NAV_TABS = ["Dashboard", "Sensors", "History", "Analytics", "Settings"];

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

        {/* Nav tabs */}
        <div style={N.links}>
          {NAV_TABS.map(l => (
            <div key={l} onClick={() => onPageChange(l)}
              style={{ ...N.link, ...(activePage === l ? N.linkActive : {}) }}>
              {l}
            </div>
          ))}
        </div>

        {/* Right controls */}
        <div style={N.right}>

          {/* Arduino status chip */}
          <div style={{ ...N.chip, borderColor: statusColor + "44", background: statusColor + "11" }}>
            <span style={{
              ...N.chipDot,
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: connStatus === "connected" ? "navPulse 2s infinite" : "none",
            }}/>
            <span style={{ color: statusColor, fontSize:"0.8rem", fontWeight:600 }}>
              {connStatus === "connected" ? "Arduino Live" : connStatus === "connecting" ? "Connecting…" : "No Arduino"}
            </span>
          </div>

          <div style={N.clock}>{time}</div>

          {/* ── Connect button (when disconnected) ─────────── */}
          {connStatus !== "connected" && !monitoring && (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                ...N.btn,
                background: connecting
                  ? "rgba(59,130,246,0.2)"
                  : "linear-gradient(135deg,#2563eb,#0891b2)",
                color: "#fff",
                opacity: connecting ? 0.8 : 1,
                boxShadow: connecting ? "none" : "0 4px 18px rgba(37,99,235,0.35)",
                cursor: connecting ? "not-allowed" : "pointer",
                minWidth: 130,
              }}
            >
              {connecting ? (
                <>
                  <span style={N.spinner}/>
                  Checking…
                </>
              ) : (
                <>🔌 Connect Arduino</>
              )}
            </button>
          )}

          {/* ── Try Again button (after popup closes) ─────── */}
          {connStatus !== "connected" && !monitoring && tryEnabled && (
            <button
              onClick={handleConnect}
              style={{ ...N.btn, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", cursor:"pointer" }}
            >
              ⟳ Try Again
            </button>
          )}

          {/* ── Start Monitor (when connected) ─────────────── */}
          {connStatus === "connected" && !monitoring && (
            <button onClick={onStart} style={{ ...N.btn, background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", boxShadow:"0 4px 18px rgba(22,163,74,0.35)" }}>
              ▶ Start Monitor
            </button>
          )}

          {/* ── Stop button ─────────────────────────────────── */}
          {monitoring && (
            <button onClick={onStop} style={{ ...N.btn, background:"linear-gradient(135deg,#dc2626,#b91c1c)", color:"#fff" }}>
              ■ Stop
            </button>
          )}

          {/* Avatar */}
          <div style={{ position:"relative" }}>
            <div style={N.avatar} onClick={() => setShowUserMenu(p => !p)}>
              {initials}
              <span style={{ position:"absolute", bottom:0, right:0, width:9, height:9, borderRadius:"50%", background: connStatus === "connected" ? "#22c55e" : "#64748b", border:"2px solid #060d1f" }}/>
            </div>
            {showUserMenu && (
              <div style={N.userMenu} onClick={() => setShowUserMenu(false)}>
                <div style={N.userMenuHeader}>
                  <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:"0.9rem" }}>{user?.name || "Guest"}</div>
                  <div style={{ fontSize:"0.72rem", color:"#64748b" }}>{user?.email || ""}</div>
                </div>
                <div style={N.menuDivider}/>
                <div style={N.menuItem} onClick={() => onPageChange("Settings")}>⚙️  Settings</div>
                <div style={N.menuItem} onClick={() => onPageChange("History")}>📊  History</div>
                <div style={N.menuDivider}/>
                <div style={{ ...N.menuItem, color:"#ef4444" }} onClick={onLogout}>🚪  Logout</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── NOT CONNECTED POPUP ─────────────────────────────── */}
      {showPopup && (
        <>
          <div style={P.backdrop} onClick={() => { clearInterval(countRef.current); setShowPopup(false); setTryEnabled(true); }}/>
          <div style={P.box}>
            <div style={P.iconRing}><span style={{ fontSize:"2rem" }}>🔌</span></div>
            <div style={P.title}>Arduino Not Detected</div>
            <div style={P.msg}>No Arduino board found on the serial port.</div>

            <div style={P.checklist}>
              <div style={{ fontSize:"0.72rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600, marginBottom:12 }}>
                Check these:
              </div>
              {[
                "Arduino plugged in via USB cable",
                "sensor_sender.ino uploaded via Arduino IDE",
                "Backend server running (npm run dev)",
                "ARDUINO_PORT correct in backend/.env",
              ].map(t => (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444", fontSize:"0.7rem", fontWeight:700, flexShrink:0 }}>✕</div>
                  <span style={{ fontSize:"0.85rem", color:"#94a3b8" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Countdown bar */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.72rem", color:"#64748b" }}>Auto-closing</span>
                <span style={{ fontSize:"0.72rem", color:"#f59e0b", fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{popupTimer}s</span>
              </div>
              <div style={{ height:5, background:"rgba(59,130,246,0.08)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(popupTimer/5)*100}%`, background:"linear-gradient(90deg,#ef4444,#f97316,#f59e0b)", borderRadius:3, transition:"width 1s linear", boxShadow:"0 0 8px rgba(239,68,68,0.5)" }}/>
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button style={P.btnClose} onClick={() => { clearInterval(countRef.current); setShowPopup(false); setTryEnabled(true); }}>
                Close
              </button>
              <button style={P.btnRetry} onClick={() => { clearInterval(countRef.current); setShowPopup(false); handleConnect(); }}>
                ⟳ Retry Now
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes navPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from{opacity:0;transform:translate(-50%,-46%) scale(0.84)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 70%{box-shadow:0 0 0 16px rgba(239,68,68,0)} }
      `}</style>
    </>
  );
}

const N = {
  nav:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"68px", background:"rgba(6,13,31,0.96)", borderBottom:"1px solid rgba(59,130,246,0.12)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:200, gap:"10px", fontFamily:"'Outfit',sans-serif" },
  brand:{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 },
  logoBox:{ width:38, height:38, borderRadius:"10px", background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", boxShadow:"0 0 20px rgba(59,130,246,0.35)" },
  brandName:{ fontWeight:800, fontSize:"1.1rem", color:"#e2e8f0", letterSpacing:"-0.02em" },
  brandSub:{ fontSize:"0.62rem", color:"#475569" },
  links:{ display:"flex", gap:"2px", alignItems:"center" },
  link:{ padding:"6px 13px", borderRadius:"8px", fontSize:"0.85rem", color:"#64748b", cursor:"pointer", fontWeight:500, transition:"all 0.2s" },
  linkActive:{ background:"rgba(59,130,246,0.15)", color:"#60a5fa", fontWeight:700 },
  right:{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 },
  chip:{ display:"flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"20px", border:"1px solid", backdropFilter:"blur(10px)" },
  chipDot:{ width:7, height:7, borderRadius:"50%", flexShrink:0 },
  clock:{ fontSize:"0.78rem", color:"#475569", fontFamily:"'JetBrains Mono',monospace", minWidth:60 },
  btn:{ fontFamily:"'Outfit',sans-serif", fontSize:"0.8rem", fontWeight:600, border:"none", borderRadius:"9px", padding:"7px 14px", display:"flex", alignItems:"center", gap:"5px", transition:"all 0.2s", whiteSpace:"nowrap" },
  spinner:{ display:"inline-block", width:12, height:12, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" },
  avatar:{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, color:"#fff", cursor:"pointer", position:"relative", boxShadow:"0 0 0 2px rgba(59,130,246,0.25)" },
  userMenu:{ position:"absolute", top:"calc(100% + 10px)", right:0, background:"linear-gradient(135deg,rgba(13,25,60,0.98),rgba(10,18,50,0.98))", border:"1px solid rgba(59,130,246,0.15)", borderRadius:"14px", padding:"8px", minWidth:200, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", zIndex:300 },
  userMenuHeader:{ padding:"10px 12px 8px" },
  menuDivider:{ height:1, background:"rgba(59,130,246,0.08)", margin:"4px 0" },
  menuItem:{ padding:"9px 12px", borderRadius:"8px", fontSize:"0.85rem", color:"#94a3b8", cursor:"pointer" },
};

const P = {
  backdrop:{ position:"fixed", inset:0, background:"rgba(2,6,18,0.88)", backdropFilter:"blur(12px)", zIndex:300 },
  box:{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:400, width:"min(500px,92vw)", background:"linear-gradient(160deg,rgba(15,23,55,0.99),rgba(10,16,42,0.99))", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"24px", padding:"40px 36px 32px", fontFamily:"'Outfit',sans-serif", boxShadow:"0 0 100px rgba(239,68,68,0.12),0 40px 100px rgba(0,0,0,0.7)", animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" },
  iconRing:{ width:72, height:72, borderRadius:"50%", background:"rgba(239,68,68,0.08)", border:"2px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", animation:"ringPulse 2s infinite" },
  title:{ fontWeight:800, fontSize:"1.4rem", color:"#f87171", textAlign:"center", marginBottom:8 },
  msg:{ fontSize:"0.85rem", color:"#64748b", textAlign:"center", lineHeight:1.7, marginBottom:24 },
  checklist:{ background:"rgba(6,13,31,0.7)", border:"1px solid rgba(59,130,246,0.1)", borderRadius:14, padding:"18px 20px", marginBottom:20 },
  btnClose:{ flex:1, fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:"0.85rem", background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.15)", color:"#60a5fa", borderRadius:12, padding:12, cursor:"pointer" },
  btnRetry:{ flex:1, fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:"0.85rem", background:"linear-gradient(135deg,#2563eb,#0891b2)", border:"none", color:"#fff", borderRadius:12, padding:12, cursor:"pointer" },
};
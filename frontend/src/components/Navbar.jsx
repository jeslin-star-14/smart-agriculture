// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";

export default function Navbar({ connStatus, monitoring, onStart, onStop, onRetry, user, onLogout, activePage, onPageChange, cloudMode }) {
  const [time, setTime]             = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "AG";

  const NAV_TABS = ["Dashboard", "Sensors", "History", "Analytics", "Settings"];

  return (
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

      {/* Right */}
      <div style={N.right}>

        {/* Cloud / Arduino status chip */}
        {cloudMode ? (
          <div style={{ ...N.chip, borderColor: "#3b82f644", background: "#3b82f611" }}>
            <span style={{ ...N.chipDot, background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }} />
            <span style={{ color: "#60a5fa", fontSize: "0.8rem", fontWeight: 600 }}>☁️ Cloud</span>
          </div>
        ) : (
          <div style={{ ...N.chip, borderColor: (connStatus === "connected" ? "#22c55e" : "#ef4444") + "44", background: (connStatus === "connected" ? "#22c55e" : "#ef4444") + "11" }}>
            <span style={{ ...N.chipDot, background: connStatus === "connected" ? "#22c55e" : "#ef4444" }} />
            <span style={{ color: connStatus === "connected" ? "#22c55e" : "#ef4444", fontSize: "0.8rem", fontWeight: 600 }}>
              {connStatus === "connected" ? "Arduino Live" : "No Arduino"}
            </span>
          </div>
        )}

        {/* Start / Stop buttons — only show when not cloud only */}
        {!monitoring && connStatus === "connected" && (
          <button style={{ ...N.btn, ...N.btnPrimary }} onClick={onStart}>
            ▶ Start
          </button>
        )}
        {monitoring && (
          <button style={{ ...N.btn, ...N.btnDanger }} onClick={onStop}>
            ■ Stop
          </button>
        )}

        <div style={N.clock}>{time}</div>

        {/* Logout button — always visible */}
        <button
          onClick={onLogout}
          style={{ fontFamily:"'Outfit',sans-serif", fontSize:"0.78rem", fontWeight:600, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:"9px", padding:"7px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all 0.2s", whiteSpace:"nowrap" }}
        >
          🚪 Logout
        </button>

        {/* User avatar */}
        <div style={{ position: "relative" }}>
          <div style={N.avatar} onClick={() => setShowUserMenu(p => !p)}>
            {initials}
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#3b82f6", border: "2px solid #060d1f" }} />
          </div>
          {showUserMenu && (
            <div style={N.userMenu} onClick={() => setShowUserMenu(false)}>
              <div style={N.userMenuHeader}>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.9rem" }}>{user?.name || "Guest"}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{user?.email || "user"}</div>
              </div>
              <div style={N.menuDivider} />
              <div style={N.menuItem} onClick={() => onPageChange("Settings")}>⚙️  Settings</div>
              <div style={N.menuItem} onClick={() => onPageChange("History")}>📊  My Reports</div>
              <div style={N.menuDivider} />
              <div style={{ ...N.menuItem, color: "#ef4444" }} onClick={onLogout}>🚪  Sign Out</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const N = {
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: "68px", background: "rgba(6,13,31,0.96)", borderBottom: "1px solid rgba(59,130,246,0.12)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 200, gap: "12px", fontFamily: "'Outfit',sans-serif" },
  brand: { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  logoBox: { width: 38, height: 38, borderRadius: "10px", background: "linear-gradient(135deg,#1d4ed8,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 0 20px rgba(59,130,246,0.35)" },
  brandName: { fontWeight: 800, fontSize: "1.1rem", color: "#e2e8f0", letterSpacing: "-0.02em" },
  brandSub: { fontSize: "0.65rem", color: "#475569", letterSpacing: "0.04em" },
  links: { display: "flex", gap: "2px", alignItems: "center" },
  link: { padding: "6px 14px", borderRadius: "8px", fontSize: "0.85rem", color: "#64748b", cursor: "pointer", fontWeight: 500, transition: "all 0.2s" },
  linkActive: { background: "rgba(59,130,246,0.15)", color: "#60a5fa", fontWeight: 700 },
  right: { display: "flex", alignItems: "center", gap: "9px", flexShrink: 0 },
  chip: { display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", border: "1px solid" },
  chipDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  clock: { fontSize: "0.78rem", color: "#475569", fontFamily: "'JetBrains Mono',monospace", minWidth: 65 },
  btn: { fontFamily: "'Outfit',sans-serif", fontSize: "0.8rem", fontWeight: 600, border: "none", borderRadius: "9px", padding: "7px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnPrimary: { background: "linear-gradient(135deg,#2563eb,#0891b2)", color: "#fff", boxShadow: "0 4px 18px rgba(37,99,235,0.35)" },
  btnDanger: { background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1d4ed8,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: "#fff", cursor: "pointer", position: "relative", boxShadow: "0 0 0 2px rgba(59,130,246,0.25)" },
  userMenu: { position: "absolute", top: "calc(100% + 10px)", right: 0, background: "linear-gradient(135deg,rgba(13,25,60,0.98),rgba(10,18,50,0.98))", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "14px", padding: "8px", minWidth: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 300 },
  userMenuHeader: { padding: "10px 12px 8px" },
  menuDivider: { height: 1, background: "rgba(59,130,246,0.08)", margin: "4px 0" },
  menuItem: { padding: "9px 12px", borderRadius: "8px", fontSize: "0.85rem", color: "#94a3b8", cursor: "pointer", transition:"background 0.15s" },
};
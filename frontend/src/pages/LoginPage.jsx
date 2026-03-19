// frontend/src/pages/LoginPage.jsx
import { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export default function LoginPage({ onLogin, onGoRegister }) {
  const [form, setForm]         = useState({ emailOrUsername: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handle(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.emailOrUsername.trim()) { setError("Please enter your email or username."); return; }
    if (!form.password)               { setError("Please enter your password."); return; }

    setLoading(true); setError("");
    try {
      const res  = await fetch(BACKEND + "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: form.emailOrUsername.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed."); }
      else {
        localStorage.setItem("agri_token", data.token);
        localStorage.setItem("agri_user",  JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch { setError("Cannot reach server. Make sure backend is running (npm run dev)."); }
    setLoading(false);
  }

  return (
    <div style={S.page}>
      <div style={{ ...S.blob, top:"-15%", left:"-8%",  width:520, height:520, background:"radial-gradient(circle,rgba(37,99,235,0.13),transparent 70%)" }}/>
      <div style={{ ...S.blob, bottom:"-15%", right:"-8%", width:440, height:440, background:"radial-gradient(circle,rgba(8,145,178,0.1),transparent 70%)" }}/>

      <div style={S.card}>
        <Logo/>

        <div style={S.heading}>Welcome back</div>
        <div style={S.sub}>Sign in with your email or username</div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>

          <InputField label="Email or Username" icon="👤">
            <input name="emailOrUsername" type="text" value={form.emailOrUsername} onChange={handle}
              placeholder="email@example.com or username" autoComplete="username"
              style={S.input}/>
          </InputField>

          <InputField label="Password" icon="🔒">
            <input name="password" type={showPass?"text":"password"} value={form.password}
              onChange={handle} placeholder="Your password"
              autoComplete="current-password" style={{ ...S.input, paddingRight:46 }}/>
            <button type="button" onClick={()=>setShowPass(p=>!p)} style={S.eyeBtn}>
              {showPass?"🙈":"👁️"}
            </button>
          </InputField>

          <div style={{ textAlign:"right", marginTop:-10 }}>
            <span style={{ fontSize:"0.78rem", color:"#3b82f6", cursor:"pointer" }}>Forgot password?</span>
          </div>

          {error && <ErrBox msg={error}/>}

          <button type="submit" disabled={loading}
            style={{ ...S.primaryBtn, opacity:loading?0.7:1 }}>
            {loading ? <><Spin/> Signing in…</> : "Sign In →"}
          </button>
        </form>

        <div style={S.switchRow}>
          Don't have an account?{" "}
          <span style={S.switchLink} onClick={onGoRegister}>Create account</span>
        </div>

        <div style={S.demoBox}>
          🧪 Demo: <b>demo@agri.com</b> / <b>demo1234</b>
          <div style={{ fontSize:"0.68rem", color:"#334155", marginTop:3 }}>Works without MongoDB registration</div>
        </div>
      </div>

      <style>{globalCSS}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ textAlign:"center", marginBottom:28 }}>
      <div style={S.logoBox}>🌿</div>
      <div style={S.logoName}>AgriSense</div>
      <div style={S.logoSub}>Smart Agriculture IoT Platform</div>
    </div>
  );
}

function InputField({ label, icon, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={S.label}>{label}</label>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <span style={S.inputIcon}>{icon}</span>
        {children}
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.28)", borderRadius:10, padding:"11px 14px", fontSize:"0.83rem", color:"#fca5a5", display:"flex", gap:8, alignItems:"flex-start", lineHeight:1.6 }}>
      ⚠️ {msg}
    </div>
  );
}

function Spin() {
  return <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:7, verticalAlign:"middle" }}/>;
}

const globalCSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes spin    { to { transform: rotate(360deg); } }
  input:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; outline: none; }
`;

const S = {
  page:{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", padding:24, position:"relative", overflow:"hidden" },
  blob:{ position:"absolute", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  card:{ position:"relative", zIndex:1, width:"100%", maxWidth:440, background:"linear-gradient(160deg,rgba(13,25,60,0.97),rgba(10,18,45,0.99))", border:"1px solid rgba(59,130,246,0.18)", borderRadius:24, padding:"36px 32px", boxShadow:"0 40px 100px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.05)", animation:"fadeUp 0.5s ease" },
  logoBox:{ width:58, height:58, borderRadius:15, margin:"0 auto 10px", background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", boxShadow:"0 0 30px rgba(59,130,246,0.4)" },
  logoName:{ fontWeight:800, fontSize:"1.3rem", color:"#e2e8f0", letterSpacing:"-0.02em" },
  logoSub:{ fontSize:"0.7rem", color:"#475569", marginTop:3 },
  heading:{ fontWeight:800, fontSize:"1.65rem", color:"#e2e8f0", letterSpacing:"-0.02em", marginBottom:5 },
  sub:{ fontSize:"0.83rem", color:"#64748b", marginBottom:6 },
  label:{ fontSize:"0.78rem", fontWeight:600, color:"#94a3b8", letterSpacing:"0.04em" },
  inputIcon:{ position:"absolute", left:13, fontSize:"0.95rem", pointerEvents:"none", zIndex:1 },
  input:{ width:"100%", background:"rgba(6,13,31,0.85)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:12, padding:"12px 14px 12px 42px", color:"#e2e8f0", fontSize:"0.9rem", fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s,box-shadow 0.2s" },
  eyeBtn:{ position:"absolute", right:12, background:"none", border:"none", cursor:"pointer", fontSize:"1.05rem", padding:4 },
  primaryBtn:{ background:"linear-gradient(135deg,#2563eb,#0891b2)", color:"#fff", border:"none", borderRadius:12, padding:"13px 14px", fontSize:"0.95rem", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:"0 6px 24px rgba(37,99,235,0.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s" },
  switchRow:{ textAlign:"center", fontSize:"0.83rem", color:"#64748b", marginTop:20 },
  switchLink:{ color:"#3b82f6", cursor:"pointer", fontWeight:700, marginLeft:4 },
  demoBox:{ marginTop:14, background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.1)", borderRadius:10, padding:"10px 14px", fontSize:"0.76rem", color:"#475569", textAlign:"center" },
};
// frontend/src/pages/LoginPage.jsx
import { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

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
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(BACKEND + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: form.emailOrUsername.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
      } else {
        localStorage.setItem("agri_token", data.token);
        localStorage.setItem("agri_user",  JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch {
      setError("Unable to connect. Please ensure the server is running.");
    }
    setLoading(false);
  }

  return (
    <div style={S.page}>
      {/* Background blobs */}
      <div style={{ ...S.blob, top:"-20%", left:"-10%", width:600, height:600, background:"radial-gradient(circle,rgba(37,99,235,0.1),transparent 70%)" }}/>
      <div style={{ ...S.blob, bottom:"-20%", right:"-10%", width:500, height:500, background:"radial-gradient(circle,rgba(8,145,178,0.08),transparent 70%)" }}/>
      <div style={{ ...S.blob, top:"40%", right:"20%", width:300, height:300, background:"radial-gradient(circle,rgba(99,102,241,0.06),transparent 70%)" }}/>

      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoBox}>🌿</div>
          <div style={S.logoName}>AgriSense</div>
          <div style={S.logoSub}>Smart Agriculture IoT Platform</div>
        </div>

        {/* Heading */}
        <div style={S.heading}>Welcome back</div>
        <div style={S.sub}>Sign in to your dashboard</div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Email or Username */}
          <div style={S.fieldWrap}>
            <label style={S.label}>Email or Username</label>
            <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
              <span style={S.fieldIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                name="emailOrUsername"
                type="text"
                value={form.emailOrUsername}
                onChange={handle}
                placeholder="Enter your email or username"
                autoComplete="username"
                style={S.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={S.fieldWrap}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <label style={S.label}>Password</label>
              <span style={{ fontSize:"0.75rem", color:"#3b82f6", cursor:"pointer", fontWeight:500 }}>Forgot password?</span>
            </div>
            <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
              <span style={S.fieldIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handle}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ ...S.input, paddingRight:46 }}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={S.eyeBtn}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={S.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <><Spinner/> Signing in…</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={S.divider}>
          <div style={S.dividerLine}/>
          <span style={S.dividerText}>New to AgriSense?</span>
          <div style={S.dividerLine}/>
        </div>

        {/* Register link */}
        <button
          onClick={onGoRegister}
          style={S.secondaryBtn}
        >
          Create an Account
        </button>
      </div>

      <div style={S.footer}>
        © {new Date().getFullYear()} AgriSense · Smart Agriculture IoT Platform
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; outline: none; }
        button:hover { filter: brightness(1.05); }
      `}</style>
    </div>
  );
}

function Spinner() {
  return <span style={{ display:"inline-block", width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:8, verticalAlign:"middle" }}/>;
}

const S = {
  page:{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", padding:"24px 16px", position:"relative", overflow:"hidden" },
  blob:{ position:"absolute", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  card:{ position:"relative", zIndex:1, width:"100%", maxWidth:420, background:"linear-gradient(160deg,rgba(13,25,60,0.95),rgba(10,18,45,0.98))", border:"1px solid rgba(59,130,246,0.15)", borderRadius:20, padding:"40px 36px 36px", boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset", animation:"fadeUp 0.5s ease" },
  logoWrap:{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:32, gap:6 },
  logoBox:{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.7rem", boxShadow:"0 8px 32px rgba(29,78,216,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset" },
  logoName:{ fontWeight:800, fontSize:"1.3rem", color:"#f1f5f9", letterSpacing:"-0.02em", marginTop:2 },
  logoSub:{ fontSize:"0.72rem", color:"#475569", letterSpacing:"0.02em" },
  heading:{ fontWeight:800, fontSize:"1.6rem", color:"#f1f5f9", letterSpacing:"-0.02em", marginBottom:5, lineHeight:1.2 },
  sub:{ fontSize:"0.875rem", color:"#64748b", marginBottom:28 },
  fieldWrap:{ display:"flex", flexDirection:"column", gap:7 },
  label:{ fontSize:"0.8rem", fontWeight:600, color:"#94a3b8", letterSpacing:"0.02em" },
  fieldIcon:{ position:"absolute", left:14, color:"#475569", pointerEvents:"none", zIndex:1, display:"flex", alignItems:"center" },
  input:{ width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(51,65,85,0.8)", borderRadius:12, padding:"13px 14px 13px 44px", color:"#f1f5f9", fontSize:"0.9rem", fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s,box-shadow 0.2s", letterSpacing:"0.01em" },
  eyeBtn:{ position:"absolute", right:14, background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center" },
  errorBox:{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"11px 14px", fontSize:"0.83rem", color:"#fca5a5", display:"flex", alignItems:"center", gap:9, lineHeight:1.5 },
  submitBtn:{ background:"linear-gradient(135deg,#2563eb,#0891b2)", color:"#fff", border:"none", borderRadius:12, padding:"14px", fontSize:"0.95rem", fontWeight:700, fontFamily:"'Outfit',sans-serif", boxShadow:"0 4px 20px rgba(37,99,235,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, letterSpacing:"0.01em", marginTop:4 },
  divider:{ display:"flex", alignItems:"center", gap:12, margin:"24px 0 20px" },
  dividerLine:{ flex:1, height:1, background:"rgba(51,65,85,0.6)" },
  dividerText:{ fontSize:"0.78rem", color:"#475569", whiteSpace:"nowrap" },
  secondaryBtn:{ width:"100%", background:"transparent", border:"1px solid rgba(59,130,246,0.25)", borderRadius:12, padding:"13px", fontSize:"0.9rem", fontWeight:600, color:"#60a5fa", cursor:"pointer", fontFamily:"'Outfit',sans-serif", letterSpacing:"0.01em", transition:"all 0.2s" },
  footer:{ position:"relative", zIndex:1, marginTop:28, fontSize:"0.72rem", color:"#1e293b", letterSpacing:"0.02em" },
};
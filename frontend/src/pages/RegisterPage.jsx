// frontend/src/pages/RegisterPage.jsx
import { useState, useRef } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [form, setForm]         = useState({ name:"", username:"", email:"", password:"", confirm:"" });
  const [errors, setErrors]     = useState({});
  const [taken, setTaken]       = useState({ username:"", email:"" });
  const [checking, setChecking] = useState({ username:false, email:false });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess]   = useState(false);
  const debounce                = useRef({});

  function handle(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]:"", general:"" }));
    if (name === "username" || name === "email") setTaken(p => ({ ...p, [name]:"" }));
    clearTimeout(debounce.current[name]);
    if ((name === "username" && value.length >= 3) || (name === "email" && value.includes("@"))) {
      debounce.current[name] = setTimeout(() => liveCheck(name, value), 700);
    }
  }

  async function liveCheck(field, value) {
    setChecking(p => ({ ...p, [field]:true }));
    try {
      const res  = await fetch(BACKEND + "/api/auth/check", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(field === "email" ? { email: value } : { username: value }),
      });
      const data = await res.json();
      if (data.taken) setTaken(p => ({ ...p, [field]: data.message }));
    } catch {}
    setChecking(p => ({ ...p, [field]:false }));
  }

  const pwChecks = [
    { label:"8+ characters",    ok: form.password.length >= 8 },
    { label:"Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label:"Lowercase letter", ok: /[a-z]/.test(form.password) },
    { label:"Number",           ok: /[0-9]/.test(form.password) },
    { label:"Special character",ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const strength      = pwChecks.filter(c => c.ok).length;
  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#10b981"][strength];

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name     = "Full name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    else if (form.username.length < 3)               e.username = "Minimum 3 characters required.";
    else if (form.username.length > 20)              e.username = "Maximum 20 characters allowed.";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Only letters, numbers and underscore allowed.";
    if (!form.email.trim())    e.email    = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.password)        e.password = "Password is required.";
    else if (strength < 4)     e.password = "Password does not meet the requirements below.";
    if (!form.confirm)         e.confirm  = "Please confirm your password.";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (taken.username) { setErrors(p => ({ ...p, username: taken.username })); return; }
    if (taken.email)    { setErrors(p => ({ ...p, email: taken.email }));       return; }

    setLoading(true);
    try {
      const res  = await fetch(BACKEND + "/api/auth/register", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          name:     form.name.trim(),
          username: form.username.trim().toLowerCase(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || "";
        if (msg.includes("EMAIL_TAKEN") || msg.toLowerCase().includes("email"))
          setErrors(p => ({ ...p, email: msg.replace("EMAIL_TAKEN: ", "") }));
        else if (msg.includes("USERNAME_TAKEN") || msg.toLowerCase().includes("username"))
          setErrors(p => ({ ...p, username: msg.replace("USERNAME_TAKEN: ", "") }));
        else if (msg.toLowerCase().includes("password"))
          setErrors(p => ({ ...p, password: msg }));
        else
          setErrors(p => ({ ...p, general: msg }));
      } else {
        localStorage.setItem("agri_token", data.token);
        localStorage.setItem("agri_user",  JSON.stringify(data.user));
        setSuccess(true);
        setTimeout(() => onRegister(data.user), 1800);
      }
    } catch {
      setErrors(p => ({ ...p, general: "Unable to connect. Please ensure the server is running." }));
    }
    setLoading(false);
  }

  if (success) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", gap:16 }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(16,185,129,0.1)", border:"2px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", marginBottom:8 }}>✓</div>
      <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#10b981", letterSpacing:"-0.02em" }}>Account Created</div>
      <div style={{ color:"#64748b", fontSize:"0.9rem" }}>Welcome to AgriSense, {form.name.split(" ")[0]}.</div>
      <div style={{ color:"#334155", fontSize:"0.82rem" }}>Redirecting to your dashboard…</div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ ...S.blob, top:"-20%", right:"-10%", width:560, height:560, background:"radial-gradient(circle,rgba(16,185,129,0.07),transparent 70%)" }}/>
      <div style={{ ...S.blob, bottom:"-20%", left:"-10%",  width:480, height:480, background:"radial-gradient(circle,rgba(37,99,235,0.08),transparent 70%)" }}/>

      <div style={S.card}>
        <div style={S.logoWrap}>
          <div style={S.logoBox}>🌿</div>
          <div style={S.logoName}>AgriSense</div>
          <div style={S.logoSub}>Smart Agriculture IoT Platform</div>
        </div>

        <div style={S.heading}>Create your account</div>
        <div style={S.sub}>Start monitoring your farm today</div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Full Name */}
          <Field label="Full Name" error={errors.name}>
            <FieldIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></FieldIcon>
            <input name="name" type="text" value={form.name} onChange={handle} placeholder="Your full name" style={iStyle(!!errors.name)}/>
          </Field>

          {/* Username */}
          <Field label="Username"
            error={errors.username || taken.username}
            badge={!errors.username && !taken.username && form.username.length >= 3 && !checking.username
              ? { text:"Available", color:"#10b981" } : null}
            checking={checking.username}>
            <FieldIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg></FieldIcon>
            <input name="username" type="text" value={form.username} onChange={handle} placeholder="Choose a username" autoComplete="username" style={iStyle(!!(errors.username || taken.username))}/>
          </Field>

          {/* Email */}
          <Field label="Email Address"
            error={errors.email || taken.email}
            badge={!errors.email && !taken.email && form.email.includes("@") && !checking.email
              ? { text:"Available", color:"#10b981" } : null}
            checking={checking.email}>
            <FieldIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></FieldIcon>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="your@email.com" autoComplete="email" style={iStyle(!!(errors.email || taken.email))}/>
          </Field>

          {/* Password */}
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            <Field label="Password" error={errors.password}>
              <FieldIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></FieldIcon>
              <input name="password" type={showPass?"text":"password"} value={form.password} onChange={handle} placeholder="Create a strong password" autoComplete="new-password" style={{ ...iStyle(!!errors.password), paddingRight:46 }}/>
              <button type="button" onClick={() => setShowPass(p=>!p)} style={S.eyeBtn}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </Field>

            {/* Password strength */}
            {form.password && (
              <div style={{ paddingLeft:2 }}>
                <div style={{ display:"flex", gap:3, marginBottom:6 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= strength ? strengthColor : "rgba(51,65,85,0.6)", transition:"background 0.3s" }}/>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:"0.72rem", color:strengthColor, fontWeight:600 }}>{strengthLabel}</span>
                  <span style={{ fontSize:"0.7rem", color:"#475569" }}>{strength} of 5 requirements met</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px" }}>
                  {pwChecks.map(c => (
                    <div key={c.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem", color: c.ok ? "#10b981" : "#475569" }}>
                      <span style={{ width:14, height:14, borderRadius:"50%", background: c.ok ? "rgba(16,185,129,0.15)" : "rgba(51,65,85,0.4)", border: `1px solid ${c.ok ? "rgba(16,185,129,0.4)" : "rgba(51,65,85,0.6)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", flexShrink:0 }}>
                        {c.ok ? "✓" : ""}
                      </span>
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <Field label="Confirm Password" error={errors.confirm}>
            <FieldIcon><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></FieldIcon>
            <input name="confirm" type={showPass?"text":"password"} value={form.confirm} onChange={handle} placeholder="Re-enter your password" autoComplete="new-password" style={iStyle(!!errors.confirm)}/>
          </Field>

          {errors.general && (
            <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"11px 14px", fontSize:"0.83rem", color:"#fca5a5", display:"flex", alignItems:"center", gap:9 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.general}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ ...S.submitBtn, opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer", marginTop:4 }}>
            {loading ? <><Spinner/> Creating account…</> : "Create Account"}
          </button>
        </form>

        <div style={S.divider}>
          <div style={S.dividerLine}/>
          <span style={S.dividerText}>Already have an account?</span>
          <div style={S.dividerLine}/>
        </div>

        <button onClick={onGoLogin} style={S.secondaryBtn}>Sign In</button>
      </div>

      <div style={S.footer}>© {new Date().getFullYear()} AgriSense · Smart Agriculture IoT Platform</div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important; outline: none; }
      `}</style>
    </div>
  );
}

function Field({ label, error, badge, checking, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <label style={{ fontSize:"0.8rem", fontWeight:600, color:"#94a3b8", letterSpacing:"0.02em" }}>{label}</label>
        {checking && <span style={{ fontSize:"0.7rem", color:"#64748b" }}>Checking…</span>}
        {!checking && badge && <span style={{ fontSize:"0.7rem", color: badge.color, fontWeight:600 }}>✓ {badge.text}</span>}
      </div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {children}
      </div>
      {error && <span style={{ fontSize:"0.75rem", color:"#f87171", marginTop:1, display:"flex", alignItems:"center", gap:5 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {error}
      </span>}
    </div>
  );
}

function FieldIcon({ children }) {
  return <span style={{ position:"absolute", left:14, color:"#475569", pointerEvents:"none", zIndex:1, display:"flex", alignItems:"center" }}>{children}</span>;
}

function Spinner() {
  return <span style={{ display:"inline-block", width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:8, verticalAlign:"middle" }}/>;
}

function iStyle(hasError) {
  return {
    width:"100%", background:"rgba(15,23,42,0.8)",
    border: `1px solid ${hasError ? "rgba(239,68,68,0.35)" : "rgba(51,65,85,0.8)"}`,
    borderRadius:12, padding:"13px 14px 13px 44px",
    color:"#f1f5f9", fontSize:"0.9rem", fontFamily:"'Outfit',sans-serif",
    transition:"border-color 0.2s,box-shadow 0.2s", letterSpacing:"0.01em",
  };
}

const S = {
  page:{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", padding:"24px 16px", position:"relative", overflow:"hidden" },
  blob:{ position:"absolute", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  card:{ position:"relative", zIndex:1, width:"100%", maxWidth:440, background:"linear-gradient(160deg,rgba(13,25,60,0.95),rgba(10,18,45,0.98))", border:"1px solid rgba(59,130,246,0.15)", borderRadius:20, padding:"36px 34px 32px", boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset", animation:"fadeUp 0.5s ease" },
  logoWrap:{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28, gap:6 },
  logoBox:{ width:52, height:52, borderRadius:15, background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", boxShadow:"0 8px 32px rgba(29,78,216,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset" },
  logoName:{ fontWeight:800, fontSize:"1.25rem", color:"#f1f5f9", letterSpacing:"-0.02em", marginTop:2 },
  logoSub:{ fontSize:"0.7rem", color:"#475569" },
  heading:{ fontWeight:800, fontSize:"1.5rem", color:"#f1f5f9", letterSpacing:"-0.02em", marginBottom:5 },
  sub:{ fontSize:"0.875rem", color:"#64748b", marginBottom:24 },
  eyeBtn:{ position:"absolute", right:14, background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center" },
  submitBtn:{ background:"linear-gradient(135deg,#2563eb,#0891b2)", color:"#fff", border:"none", borderRadius:12, padding:"14px", fontSize:"0.95rem", fontWeight:700, fontFamily:"'Outfit',sans-serif", boxShadow:"0 4px 20px rgba(37,99,235,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:6, letterSpacing:"0.01em" },
  divider:{ display:"flex", alignItems:"center", gap:12, margin:"24px 0 20px" },
  dividerLine:{ flex:1, height:1, background:"rgba(51,65,85,0.6)" },
  dividerText:{ fontSize:"0.78rem", color:"#475569", whiteSpace:"nowrap" },
  secondaryBtn:{ width:"100%", background:"transparent", border:"1px solid rgba(59,130,246,0.25)", borderRadius:12, padding:"13px", fontSize:"0.9rem", fontWeight:600, color:"#60a5fa", cursor:"pointer", fontFamily:"'Outfit',sans-serif", letterSpacing:"0.01em", transition:"all 0.2s" },
  footer:{ position:"relative", zIndex:1, marginTop:28, fontSize:"0.72rem", color:"#1e293b" },
};
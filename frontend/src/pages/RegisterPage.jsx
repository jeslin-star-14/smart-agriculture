// frontend/src/pages/RegisterPage.jsx
import { useState, useRef } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function RegisterPage({ onRegister, onGoLogin }) {
  const [form, setForm]         = useState({ name:"", username:"", email:"", password:"", confirm:"" });
  const [errors, setErrors]     = useState({});
  const [taken, setTaken]       = useState({ username:"", email:"" });
  const [checking, setChecking] = useState({ username:false, email:false });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess]   = useState(false);
  const debounce                = useRef({});

  // ── handle input change ───────────────────────────────────
  function handle(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]:"", general:"" }));
    if (name === "username" || name === "email") setTaken(p => ({ ...p, [name]:"" }));

    // debounced live check
    clearTimeout(debounce.current[name]);
    if ((name === "username" && value.length >= 3) || (name === "email" && value.includes("@"))) {
      debounce.current[name] = setTimeout(() => liveCheck(name, value), 600);
    }
  }

  async function liveCheck(field, value) {
    setChecking(p => ({ ...p, [field]:true }));
    try {
      const body = field === "email" ? { email: value } : { username: value };
      const res  = await fetch(BACKEND + "/api/auth/check", {
        method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.taken) setTaken(p => ({ ...p, [field]: data.message }));
    } catch {}
    setChecking(p => ({ ...p, [field]:false }));
  }

  // ── password strength ─────────────────────────────────────
  const pwChecks = [
    { label:"8+ characters",    ok: form.password.length >= 8 },
    { label:"Uppercase (A-Z)",  ok: /[A-Z]/.test(form.password) },
    { label:"Lowercase (a-z)",  ok: /[a-z]/.test(form.password) },
    { label:"Number (0-9)",     ok: /[0-9]/.test(form.password) },
    { label:"Symbol (!@#$...)", ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const strength      = pwChecks.filter(c => c.ok).length;
  const strengthLabel = ["","Very Weak","Weak","Fair","Strong","Very Strong"][strength];
  const strengthColor = ["","#ef4444","#f97316","#f59e0b","#3b82f6","#10b981"][strength];

  // ── validation ────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.name.trim())      e.name = "Full name is required.";
    if (!form.username.trim())  e.username = "Username is required.";
    else if (form.username.length < 3)  e.username = "At least 3 characters.";
    else if (form.username.length > 20) e.username = "Max 20 characters.";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Letters, numbers and _ only.";
    if (!form.email.trim())     e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)         e.password = "Password is required.";
    else if (strength < 4)      e.password = "Password is too weak — check requirements below.";
    if (!form.confirm)          e.confirm = "Please confirm your password.";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  // ── submit ────────────────────────────────────────────────
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
        if (msg.startsWith("EMAIL_TAKEN"))    setErrors(p => ({ ...p, email: msg.replace("EMAIL_TAKEN: ","") }));
        else if (msg.startsWith("USERNAME_TAKEN")) setErrors(p => ({ ...p, username: msg.replace("USERNAME_TAKEN: ","") }));
        else if (msg.toLowerCase().includes("password")) setErrors(p => ({ ...p, password: msg }));
        else setErrors(p => ({ ...p, general: msg }));
      } else {
        localStorage.setItem("agri_token", data.token);
        localStorage.setItem("agri_user",  JSON.stringify(data.user));
        setSuccess(true);
        setTimeout(() => onRegister(data.user), 2000);
      }
    } catch { setErrors(p => ({ ...p, general:"Cannot reach server." })); }
    setLoading(false);
  }

  // ── success screen ────────────────────────────────────────
  if (success) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", gap:16, animation:"fadeUp 0.5s ease" }}>
      <div style={{ fontSize:"4rem" }}>🎉</div>
      <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#10b981" }}>Account Created!</div>
      <div style={{ color:"#94a3b8", fontSize:"0.9rem" }}>Welcome to AgriSense, {form.name.split(" ")[0]}!</div>
      <div style={{ color:"#475569", fontSize:"0.8rem" }}>Redirecting to your dashboard…</div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ ...S.blob, top:"-15%", right:"-8%", width:500, height:500, background:"radial-gradient(circle,rgba(16,185,129,0.1),transparent 70%)" }}/>
      <div style={{ ...S.blob, bottom:"-15%", left:"-8%",  width:440, height:440, background:"radial-gradient(circle,rgba(37,99,235,0.1),transparent 70%)" }}/>

      <div style={S.card}>
        <Logo/>
        <div style={S.heading}>Create your account</div>
        <div style={S.sub}>Join AgriSense and monitor your farm</div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Full Name */}
          <InputField label="Full Name" icon="🪪" error={errors.name}>
            <input name="name" type="text" value={form.name} onChange={handle}
              placeholder="John Doe" style={iStyle(!!errors.name)}/>
          </InputField>

          {/* Username */}
          <InputField label="Username" icon="@"
            error={errors.username || taken.username}
            hint={!errors.username && !taken.username && form.username.length >= 3 && !checking.username ? "✓ Available" : ""}
            checking={checking.username}>
            <input name="username" type="text" value={form.username} onChange={handle}
              placeholder="your_username" autoComplete="username"
              style={iStyle(!!(errors.username || taken.username))}/>
          </InputField>

          {/* Email */}
          <InputField label="Email Address" icon="✉️"
            error={errors.email || taken.email}
            hint={!errors.email && !taken.email && form.email.includes("@") && !checking.email ? "✓ Available" : ""}
            checking={checking.email}>
            <input name="email" type="email" value={form.email} onChange={handle}
              placeholder="you@example.com" autoComplete="email"
              style={iStyle(!!(errors.email || taken.email))}/>
          </InputField>

          {/* Password */}
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <InputField label="Password" icon="🔒" error={errors.password}>
              <input name="password" type={showPass?"text":"password"} value={form.password}
                onChange={handle} placeholder="Min 8 chars, A-Z, 0-9, symbol"
                autoComplete="new-password" style={{ ...iStyle(!!errors.password), paddingRight:46 }}/>
              <button type="button" onClick={()=>setShowPass(p=>!p)} style={S.eyeBtn}>
                {showPass?"🙈":"👁️"}
              </button>
            </InputField>

            {/* Strength indicator */}
            {form.password && (
              <div style={{ paddingLeft:2 }}>
                <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                  {[1,2,3,4,5].map(i=>(
                    <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=strength ? strengthColor : "rgba(59,130,246,0.07)", transition:"background 0.3s" }}/>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:"0.7rem", color:strengthColor, fontWeight:700 }}>{strengthLabel}</span>
                  <span style={{ fontSize:"0.68rem", color:"#475569" }}>{strength}/5 requirements met</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 14px" }}>
                  {pwChecks.map(c=>(
                    <span key={c.label} style={{ fontSize:"0.68rem", color:c.ok?"#10b981":"#475569", display:"flex", alignItems:"center", gap:3 }}>
                      <span style={{ fontSize:"0.75rem" }}>{c.ok?"✓":"○"}</span>{c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <InputField label="Confirm Password" icon="🔐" error={errors.confirm}>
            <input name="confirm" type={showPass?"text":"password"} value={form.confirm}
              onChange={handle} placeholder="Repeat your password"
              autoComplete="new-password" style={iStyle(!!errors.confirm)}/>
          </InputField>

          {errors.general && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.28)", borderRadius:10, padding:"11px 14px", fontSize:"0.83rem", color:"#fca5a5" }}>
              ⚠️ {errors.general}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ ...S.primaryBtn, opacity:loading?0.7:1, marginTop:4 }}>
            {loading ? <><Spin/> Creating account…</> : "Create Account →"}
          </button>
        </form>

        <div style={{ textAlign:"center", fontSize:"0.83rem", color:"#64748b", marginTop:20 }}>
          Already have an account?{" "}
          <span style={{ color:"#3b82f6", cursor:"pointer", fontWeight:700 }} onClick={onGoLogin}>Sign in</span>
        </div>
      </div>

      <style>{globalCSS}</style>
    </div>
  );
}

// ── shared components ─────────────────────────────────────────
function Logo() {
  return (
    <div style={{ textAlign:"center", marginBottom:22 }}>
      <div style={S.logoBox}>🌿</div>
      <div style={S.logoName}>AgriSense</div>
      <div style={S.logoSub}>Smart Agriculture IoT Platform</div>
    </div>
  );
}

function InputField({ label, icon, error, hint, checking, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <label style={S.label}>{label}</label>
        {checking && <span style={{ fontSize:"0.68rem", color:"#64748b" }}>⟳ Checking…</span>}
        {!checking && hint && <span style={{ fontSize:"0.68rem", color:"#10b981", fontWeight:700 }}>{hint}</span>}
      </div>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        <span style={S.inputIcon}>{icon}</span>
        {children}
      </div>
      {error && <span style={{ fontSize:"0.73rem", color:"#f87171", marginTop:2 }}>⚠ {error}</span>}
    </div>
  );
}

function Spin() {
  return <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:7, verticalAlign:"middle" }}/>;
}

function iStyle(hasError) {
  return {
    width:"100%", background:"rgba(6,13,31,0.85)",
    border: hasError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(59,130,246,0.15)",
    borderRadius:12, padding:"11px 14px 11px 42px",
    color:"#e2e8f0", fontSize:"0.9rem", fontFamily:"'Outfit',sans-serif",
    transition:"border-color 0.2s,box-shadow 0.2s",
  };
}

const globalCSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes spin    { to { transform: rotate(360deg); } }
  input:focus { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; outline: none; }
`;

const S = {
  page:{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060d1f", fontFamily:"'Outfit',sans-serif", padding:"24px", position:"relative", overflow:"hidden" },
  blob:{ position:"absolute", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  card:{ position:"relative", zIndex:1, width:"100%", maxWidth:460, background:"linear-gradient(160deg,rgba(13,25,60,0.97),rgba(10,18,45,0.99))", border:"1px solid rgba(59,130,246,0.18)", borderRadius:24, padding:"32px 30px", boxShadow:"0 40px 100px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.05)", animation:"fadeUp 0.5s ease" },
  logoBox:{ width:54, height:54, borderRadius:14, margin:"0 auto 10px", background:"linear-gradient(135deg,#1d4ed8,#0891b2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.7rem", boxShadow:"0 0 28px rgba(59,130,246,0.4)" },
  logoName:{ fontWeight:800, fontSize:"1.25rem", color:"#e2e8f0", letterSpacing:"-0.02em" },
  logoSub:{ fontSize:"0.68rem", color:"#475569", marginTop:3 },
  heading:{ fontWeight:800, fontSize:"1.55rem", color:"#e2e8f0", letterSpacing:"-0.02em", marginBottom:5 },
  sub:{ fontSize:"0.82rem", color:"#64748b", marginBottom:8 },
  label:{ fontSize:"0.77rem", fontWeight:600, color:"#94a3b8", letterSpacing:"0.04em" },
  inputIcon:{ position:"absolute", left:13, fontSize:"0.9rem", pointerEvents:"none", zIndex:1 },
  eyeBtn:{ position:"absolute", right:12, background:"none", border:"none", cursor:"pointer", fontSize:"1.05rem", padding:4 },
  primaryBtn:{ background:"linear-gradient(135deg,#2563eb,#0891b2)", color:"#fff", border:"none", borderRadius:12, padding:"13px 14px", fontSize:"0.95rem", fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:"0 6px 24px rgba(37,99,235,0.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
};
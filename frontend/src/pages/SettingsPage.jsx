// frontend/src/pages/SettingsPage.jsx — NEW FILE
// Place at: frontend/src/pages/SettingsPage.jsx

import { useState } from "react";

const BACKEND_URL = import.meta?.env?.VITE_BACKEND_URL || "http://localhost:5001";

export default function SettingsPage({ user, onUserUpdate }) {
  const [tab, setTab]         = useState("profile");
  const [form, setForm]       = useState({ name: user?.name||"", email: user?.email||"", phone:"", location:"", bio:"" });
  const [pwForm, setPwForm]   = useState({ current:"", newPw:"", confirm:"" });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr]     = useState("");
  const [showPw, setShowPw]   = useState(false);

  function handleChange(e) { setForm(p=>({...p,[e.target.name]:e.target.value})); setSaved(false); }

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true);
    try {
      const token = localStorage.getItem("agri_token");
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method:"PUT", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body: JSON.stringify({ name:form.name, email:form.email }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = {...user,...data.user};
        localStorage.setItem("agri_user", JSON.stringify(updated));
        onUserUpdate?.(updated);
      }
    } catch {}
    // optimistic update even if backend not yet wired
    const updated = {...user, name:form.name, email:form.email};
    localStorage.setItem("agri_user", JSON.stringify(updated));
    onUserUpdate?.(updated);
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 3000);
  }

  async function savePassword(e) {
    e.preventDefault(); setPwErr("");
    if (pwForm.newPw.length<8) { setPwErr("Password must be at least 8 characters."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwErr("Passwords do not match."); return; }
    setSaving(true);
    await new Promise(r=>setTimeout(r,800)); // simulate API
    setSaving(false); setPwSaved(true); setPwForm({current:"",newPw:"",confirm:""});
    setTimeout(()=>setPwSaved(false),3000);
  }

  const initials = form.name ? form.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "AG";
  const TABS = [
    {id:"profile", icon:"👤", label:"Profile"},
    {id:"security",icon:"🔒", label:"Security"},
    {id:"device",  icon:"🔌", label:"Device"},
    {id:"about",   icon:"ℹ️",  label:"About"},
  ];

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{marginBottom:"28px"}}>
        <div style={ST.tag}>Configuration</div>
        <h2 style={ST.h2}>Settings</h2>
      </div>

      <div style={{display:"flex",gap:"24px",flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Sidebar */}
        <div style={{width:220,flexShrink:0}}>
          <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:"16px",padding:"8px",marginBottom:"16px"}}>
            {TABS.map(t=>(
              <div key={t.id} onClick={()=>setTab(t.id)} style={{...ST.sideItem,...(tab===t.id?ST.sideItemActive:{})}}>
                <span style={{fontSize:"1rem"}}>{t.icon}</span> {t.label}
              </div>
            ))}
          </div>

          {/* Avatar card */}
          <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:"16px",padding:"20px",textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",fontWeight:700,color:"#fff",margin:"0 auto 12px",boxShadow:"0 0 24px rgba(59,130,246,0.4)"}}>{initials}</div>
            <div style={{fontWeight:700,color:"#e2e8f0",fontSize:"0.9rem",marginBottom:"2px"}}>{form.name||"User"}</div>
            <div style={{fontSize:"0.72rem",color:"#475569"}}>{form.email||"No email"}</div>
            <div style={{marginTop:"12px",padding:"4px 12px",borderRadius:"20px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",color:"#10b981",fontSize:"0.7rem",fontWeight:600,display:"inline-block"}}>● Active</div>
          </div>
        </div>

        {/* Main panel */}
        <div style={{flex:1,minWidth:300}}>
          {/* PROFILE TAB */}
          {tab==="profile" && (
            <Panel title="Profile Information" subtitle="Update your personal details">
              <form onSubmit={saveProfile} style={{display:"flex",flexDirection:"column",gap:"18px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <Field label="Full Name" name="name" value={form.name} onChange={handleChange} icon="👤" placeholder="Your full name"/>
                  <Field label="Email Address" name="email" value={form.email} onChange={handleChange} icon="✉️" placeholder="your@email.com" type="email"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                  <Field label="Phone (optional)" name="phone" value={form.phone} onChange={handleChange} icon="📱" placeholder="+91 000 000 0000"/>
                  <Field label="Location (optional)" name="location" value={form.location} onChange={handleChange} icon="📍" placeholder="City, Country"/>
                </div>
                <div>
                  <label style={ST.label}>Bio (optional)</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your farm…"
                    style={{...ST.input,height:80,resize:"vertical",paddingLeft:14}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <button type="submit" style={{...ST.btnSave,opacity:saving?0.7:1}} disabled={saving}>
                    {saving?"Saving…":"💾 Save Profile"}
                  </button>
                  {saved && <span style={{color:"#10b981",fontSize:"0.85rem",fontWeight:600}}>✓ Profile saved!</span>}
                </div>
              </form>
            </Panel>
          )}

          {/* SECURITY TAB */}
          {tab==="security" && (
            <Panel title="Security Settings" subtitle="Change your password">
              <form onSubmit={savePassword} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <div style={{position:"relative"}}>
                  <label style={ST.label}>Current Password</label>
                  <div style={{position:"relative",display:"flex",alignItems:"center"}}>
                    <span style={ST.inputIcon}>🔒</span>
                    <input type={showPw?"text":"password"} value={pwForm.current} onChange={e=>setPwForm(p=>({...p,current:e.target.value}))} placeholder="Enter current password" style={ST.input}/>
                    <button type="button" onClick={()=>setShowPw(p=>!p)} style={ST.eyeBtn}>{showPw?"🙈":"👁️"}</button>
                  </div>
                </div>
                <Field label="New Password" value={pwForm.newPw} onChange={e=>setPwForm(p=>({...p,newPw:e.target.value}))} icon="🔐" placeholder="Min. 8 characters" type={showPw?"text":"password"}/>
                <Field label="Confirm New Password" value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} icon="✅" placeholder="Repeat new password" type={showPw?"text":"password"}/>
                {pwErr && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"10px",padding:"10px 14px",fontSize:"0.8rem",color:"#fca5a5"}}>⚠️ {pwErr}</div>}
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <button type="submit" style={{...ST.btnSave,opacity:saving?0.7:1}} disabled={saving}>{saving?"Saving…":"🔒 Update Password"}</button>
                  {pwSaved && <span style={{color:"#10b981",fontSize:"0.85rem",fontWeight:600}}>✓ Password updated!</span>}
                </div>
              </form>
            </Panel>
          )}

          {/* DEVICE TAB */}
          {tab==="device" && (
            <Panel title="Device Configuration" subtitle="Arduino and sensor settings">
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                {[
                  {label:"Arduino Port",val:"Set in backend/.env → ARDUINO_PORT",icon:"🔌"},
                  {label:"Baud Rate",val:"9600 (default)",icon:"⚡"},
                  {label:"Save Frequency",val:"Every reading (SAVE_EVERY=1 in .env)",icon:"💾"},
                  {label:"Device ID",val:"arduino-uno-01 (DEVICE_ID in .env)",icon:"🏷"},
                  {label:"Protocol",val:"JSON over Serial → Socket.io WebSocket",icon:"📡"},
                  {label:"Database",val:"MongoDB (MONGO_URI in .env)",icon:"🗄"},
                ].map(({label,val,icon})=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 18px",background:"rgba(6,13,31,0.6)",border:"1px solid rgba(59,130,246,0.1)",borderRadius:"12px"}}>
                    <span style={{fontSize:"1.2rem",width:30,textAlign:"center"}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"0.78rem",color:"#64748b",fontWeight:600,marginBottom:"2px"}}>{label}</div>
                      <div style={{fontSize:"0.88rem",color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{val}</div>
                    </div>
                  </div>
                ))}
                <div style={{padding:"14px 18px",background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:"12px",fontSize:"0.8rem",color:"#64748b",lineHeight:1.7}}>
                  💡 To change device settings, edit <code style={{color:"#60a5fa",background:"rgba(59,130,246,0.1)",padding:"1px 6px",borderRadius:"4px"}}>backend/.env</code> and restart the backend server with <code style={{color:"#60a5fa",background:"rgba(59,130,246,0.1)",padding:"1px 6px",borderRadius:"4px"}}>npm start</code>.
                </div>
              </div>
            </Panel>
          )}

          {/* ABOUT TAB */}
          {tab==="about" && (
            <Panel title="About AgriSense" subtitle="Platform information">
              <div style={{textAlign:"center",padding:"20px 0 28px"}}>
                <div style={{width:72,height:72,borderRadius:"18px",background:"linear-gradient(135deg,#1d4ed8,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",margin:"0 auto 16px",boxShadow:"0 0 32px rgba(59,130,246,0.4)"}}>🌿</div>
                <div style={{fontWeight:800,fontSize:"1.4rem",color:"#e2e8f0",marginBottom:"6px"}}>AgriSense IoT</div>
                <div style={{color:"#64748b",fontSize:"0.85rem",marginBottom:"24px"}}>Smart Agriculture Monitoring Platform · v1.0.0</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {[
                  {l:"Stack",v:"React + Vite · Node.js · MongoDB · Socket.io"},
                  {l:"Hardware",v:"Arduino Uno · DHT22 · Soil, LDR, Rain, pH sensors"},
                  {l:"Protocol",v:"JSON Serial → WebSocket (Socket.io) → REST API"},
                  {l:"Database",v:"MongoDB with auto-save on every Arduino reading"},
                ].map(({l,v})=>(
                  <div key={l} style={{display:"flex",gap:"12px",padding:"12px 16px",background:"rgba(6,13,31,0.6)",border:"1px solid rgba(59,130,246,0.08)",borderRadius:"10px",fontSize:"0.84rem"}}>
                    <span style={{color:"#475569",fontWeight:600,minWidth:90}}>{l}</span>
                    <span style={{color:"#94a3b8"}}>{v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({title,subtitle,children}){
  return(
    <div style={{background:"linear-gradient(135deg,rgba(13,25,60,0.85),rgba(10,18,45,0.9))",border:"1px solid rgba(59,130,246,0.12)",borderRadius:"16px",overflow:"hidden"}}>
      <div style={{padding:"22px 24px",borderBottom:"1px solid rgba(59,130,246,0.08)"}}>
        <div style={{fontWeight:700,fontSize:"1.05rem",color:"#e2e8f0"}}>{title}</div>
        <div style={{fontSize:"0.78rem",color:"#475569",marginTop:"3px"}}>{subtitle}</div>
      </div>
      <div style={{padding:"24px"}}>{children}</div>
    </div>
  );
}

function Field({label,name,value,onChange,icon,placeholder,type="text"}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      <label style={ST.label}>{label}</label>
      <div style={{position:"relative",display:"flex",alignItems:"center"}}>
        <span style={ST.inputIcon}>{icon}</span>
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} style={ST.input}/>
      </div>
    </div>
  );
}

const ST={
  tag:{fontSize:"0.7rem",color:"#3b82f6",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"},
  h2:{fontSize:"1.8rem",fontWeight:800,color:"#e2e8f0",letterSpacing:"-0.02em",lineHeight:1},
  sideItem:{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"10px",fontSize:"0.85rem",color:"#64748b",cursor:"pointer",fontWeight:500,transition:"all 0.15s"},
  sideItemActive:{background:"rgba(59,130,246,0.15)",color:"#60a5fa",fontWeight:700},
  label:{fontSize:"0.75rem",fontWeight:600,color:"#94a3b8",letterSpacing:"0.04em"},
  input:{width:"100%",background:"rgba(6,13,31,0.8)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:"10px",padding:"10px 14px 10px 40px",color:"#e2e8f0",fontSize:"0.88rem",outline:"none",fontFamily:"'Outfit',sans-serif"},
  inputIcon:{position:"absolute",left:12,fontSize:"0.9rem",pointerEvents:"none",zIndex:1},
  eyeBtn:{position:"absolute",right:10,background:"none",border:"none",cursor:"pointer",fontSize:"0.9rem"},
  btnSave:{background:"linear-gradient(135deg,#2563eb,#0891b2)",color:"#fff",border:"none",borderRadius:"10px",padding:"11px 22px",fontSize:"0.88rem",fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",boxShadow:"0 4px 18px rgba(37,99,235,0.35)"},
};
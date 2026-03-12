// frontend/src/components/SensorCard.jsx
// REPLACE your existing SensorCard.jsx with this file

export default function SensorCard({ label, value, unit, icon, type }) {
  // Determine alert level based on sensor type & value
  function getLevel() {
    const v = parseFloat(value);
    if (isNaN(v)) return "normal";
    if (type === "temperature") {
      if (v > 40) return "danger";
      if (v > 32) return "warn";
    }
    if (type === "soil") {
      if (v < 20) return "danger";
      if (v < 35) return "warn";
    }
    if (type === "humidity") {
      if (v < 20 || v > 90) return "warn";
    }
    if (type === "ph") {
      if (v < 5 || v > 8) return "danger";
      if (v < 6 || v > 7.5) return "warn";
    }
    return "normal";
  }

  // Bar fill percentage
  function getPercent() {
    const v = parseFloat(value);
    if (isNaN(v)) return 0;
    const ranges = {
      temperature: [0, 60],
      humidity: [0, 100],
      soil: [0, 100],
      light: [0, 1000],
      ph: [0, 14],
      rain: [0, 1],
    };
    const [min, max] = ranges[type] || [0, 100];
    return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
  }

  const level = getLevel();
  const pct = getPercent();
  const hasValue = value !== null && value !== undefined && value !== "--" && value !== "--.-";

  const accentColor = {
    normal: "#00ff7f",
    warn: "#f59e0b",
    danger: "#ef4444",
  }[level];

  const displayValue =
    type === "rain"
      ? parseFloat(value) > 0 ? "RAIN" : "DRY"
      : hasValue ? String(value) : "--";

  return (
    <div style={{ ...cardStyle, borderTopColor: hasValue ? accentColor : "#1e3326" }}>
      {/* Animated top border activates when data is live */}
      <div style={{ ...topBar, background: accentColor, opacity: hasValue ? 1 : 0 }} />

      <div style={labelStyle}>{label}</div>
      <div style={iconStyle}>{icon}</div>
      <div style={{ ...valueStyle, color: accentColor }}>
        {displayValue}
      </div>
      <div style={unitStyle}>{type === "rain" ? "status" : unit}</div>

      {/* Progress bar */}
      <div style={barTrack}>
        <div
          style={{
            ...barFill,
            width: `${pct}%`,
            background: accentColor,
            transition: "width 0.8s ease, background 0.3s",
          }}
        />
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#111a14",
  border: "1px solid #1e3326",
  borderTop: "3px solid #1e3326",
  borderRadius: "10px",
  padding: "20px 18px 16px",
  position: "relative",
  overflow: "hidden",
  transition: "border-top-color 0.4s",
  fontFamily: "'Space Mono', monospace",
};

const topBar = {
  position: "absolute",
  top: 0, left: 0, right: 0,
  height: "3px",
  transition: "opacity 0.4s",
};

const labelStyle = {
  fontSize: "0.6rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#4a7a58",
  marginBottom: "8px",
};

const iconStyle = {
  fontSize: "1.4rem",
  marginBottom: "6px",
};

const valueStyle = {
  fontFamily: "'Syne', sans-serif",
  fontSize: "2.2rem",
  fontWeight: 800,
  lineHeight: 1,
  transition: "color 0.3s",
};

const unitStyle = {
  fontSize: "0.65rem",
  color: "#4a7a58",
  marginTop: "4px",
};

const barTrack = {
  height: "3px",
  background: "#1e3326",
  borderRadius: "2px",
  marginTop: "14px",
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  borderRadius: "2px",
};
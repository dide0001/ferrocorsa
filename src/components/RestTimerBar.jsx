import { T } from "../theme";
import { NAV_HEIGHT } from "./BottomNav";

export default function RestTimerBar({ timer, onToggle, onAdjust, onDismiss }) {
  const { total, remaining, running, done } = timer;
  const pct = total > 0 ? remaining / total : 0;
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const ringColor = done ? "#4FAE63" : T.accent;

  return (
    <div
      className="timer-bar-enter"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: NAV_HEIGHT,
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        background: T.surface,
        borderTop: `2px solid ${ringColor}`,
        boxShadow: `0 -3px 0 0 #000`,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 25,
      }}
    >
      <div className={done ? "pulse" : undefined} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.line} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
          {mins}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="disp" style={{ fontSize: 13 }}>
          {done ? "Klar" : "Hviletid"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button onClick={() => onAdjust(-15)} style={{ background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "3px 9px", fontSize: 12 }}>
            −15s
          </button>
          <button onClick={() => onAdjust(15)} style={{ background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "3px 9px", fontSize: 12 }}>
            +15s
          </button>
          <button onClick={onToggle} style={{ background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "3px 9px", fontSize: 12 }}>
            {running ? "Pause" : "Fortsæt"}
          </button>
        </div>
      </div>

      <button onClick={onDismiss} aria-label="Luk timer" style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, padding: 4 }}>
        ×
      </button>
    </div>
  );
}

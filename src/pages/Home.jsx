import { useEffect, useState } from "react";
import { T } from "../theme";
import { getWorkouts, getCompletedWorkouts } from "../api";
import Badge from "../components/Badge";

const WEEKLY_GOAL = 4;
const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const cardStyle = {
  background: `linear-gradient(160deg, ${T.surfaceRaised} 0%, ${T.surface} 60%)`,
  border: `1px solid ${T.line}`,
  borderRadius: T.radius,
  padding: 16,
  boxShadow: "0 8px 24px -8px #000000cc, inset 0 1px 0 0 #ffffff0a",
};

export default function Home({ onOpenWorkout, notifPermission, pushSubscription, pushError, enablePush }) {
  const [workouts, setWorkouts] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWorkouts(), getCompletedWorkouts()])
      .then(([w, c]) => {
        if (cancelled) return;
        setWorkouts(w);
        setCompleted(c);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const weekStart = startOfWeek(new Date());
  const completedThisWeek = completed.filter((c) => new Date(c.completedAt) >= weekStart);
  const doneDays = new Set(completedThisWeek.map((c) => (new Date(c.completedAt).getDay() + 6) % 7));

  const completedIds = new Set(completedThisWeek.map((c) => c.workoutId));
  const nextWorkout = workouts.find((w) => !completedIds.has(w.id)) || workouts[0];

  const today = new Date().toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      style={{
        padding: "calc(20px + env(safe-area-inset-top)) 20px 32px",
        backgroundImage: `linear-gradient(180deg, ${T.bg}66 0%, ${T.bg} 300px), url(/images/stock/asphalt-texture.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge />
        {notifPermission !== "unsupported" && (
          <button
            type="button"
            onClick={enablePush}
            disabled={!!pushSubscription}
            aria-label="Aktivér push-notifikationer"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: T.surfaceRaised,
              border: `1px solid ${pushSubscription ? T.accent : T.lineBright}`,
              color: pushSubscription ? T.accent : T.textMuted,
              boxShadow: pushSubscription ? `0 0 14px -2px ${T.accent}88` : "none",
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              {pushSubscription && <circle cx="19" cy="6" r="3.2" fill={T.accent} stroke="none" />}
            </svg>
          </button>
        )}
      </div>

      <h1 style={{ fontSize: 15, fontWeight: 500, margin: "20px 0 0", color: T.textMuted }}>Benvenuto,</h1>
      <div className="disp" style={{ fontSize: 32, lineHeight: 1.05, color: T.text }}>
        <span style={{ color: T.accent }}>Pilota</span>.
      </div>
      <span style={{ fontSize: 12.5, color: T.textMuted, textTransform: "capitalize", display: "block", marginTop: 6 }}>
        {today}
      </span>
      {pushError && <div style={{ fontSize: 11, color: "#D9463A", marginTop: 6 }}>{pushError}</div>}

      {status === "loading" && (
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 40, textAlign: "center" }}>Henter data…</div>
      )}
      {status === "error" && (
        <div style={{ color: "#D9463A", fontSize: 13, marginTop: 40, textAlign: "center" }}>
          Kunne ikke hente data. Prøv igen senere.
        </div>
      )}

      {status === "ready" && (
        <>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
            <ScoreRing />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <StatRow label="Strength" color="#FF2800" />
              <StatRow label="Endurance" color="#3E7BE0" />
              <StatRow label="Recovery" color="#4FAE63" />
            </div>
          </div>

          <SectionLabel>Denne uge</SectionLabel>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="disp mono" style={{ fontSize: 32, fontStyle: "normal", transform: "none", color: T.accent }}>
                {completedThisWeek.length}
              </span>
              <span style={{ color: T.textMuted, fontSize: 13 }}>/ {WEEKLY_GOAL} træninger</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, alignItems: "flex-end", height: 36 }}>
              {WEEKDAY_LABELS.map((label, i) => {
                const done = doneDays.has(i);
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "100%",
                        height: done ? 30 : 10,
                        borderRadius: 5,
                        background: done ? `linear-gradient(180deg, #FF6A4D, ${T.accent})` : T.surfaceRaised,
                        border: `1px solid ${done ? T.accent : T.line}`,
                        boxShadow: done ? `0 0 10px -1px ${T.accent}aa` : "none",
                        transition: "height 200ms ease",
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: done ? T.text : T.textFaint, marginTop: 4, fontWeight: done ? 700 : 400 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <SectionLabel>Næste træning</SectionLabel>
          {nextWorkout ? (
            <button
              type="button"
              onClick={() => onOpenWorkout(nextWorkout.id)}
              style={{
                ...cardStyle,
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: T.radiusSm,
                  background: `linear-gradient(160deg, #FF6A4D, ${T.accent})`,
                  color: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 4px 14px -2px ${T.accent}99`,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 7v10M4 9v6M20 7v10M22 9v6M8 12h8" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div className="disp" style={{ fontSize: 15 }}>{nextWorkout.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                  {nextWorkout.exercises.length} øvelser · {nextWorkout.category}
                </div>
              </div>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: T.accent,
                  color: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                →
              </span>
            </button>
          ) : (
            <div style={{ color: T.textMuted, fontSize: 13 }}>Ingen workouts endnu — opret én under Workouts.</div>
          )}
        </>
      )}
    </div>
  );
}

function ScoreRing() {
  const size = 100;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, filter: `drop-shadow(0 0 12px ${T.accentDim})` }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.line} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.lineBright}
          strokeWidth={stroke}
          strokeDasharray={`${circumference * 0.001} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
        </svg>
        <span style={{ fontSize: 8.5, color: T.textFaint, marginTop: 4, letterSpacing: "0.04em" }}>SNART</span>
      </div>
    </div>
  );
}

function StatRow({ label, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <span className="mono" style={{ fontSize: 13, color: T.textFaint }}>—</span>
      </div>
      <div style={{ width: "100%", height: 3, borderRadius: 2, background: T.line, marginTop: 5, overflow: "hidden" }}>
        <div style={{ width: "28%", height: "100%", background: color, opacity: 0.5 }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: T.textMuted,
        margin: "24px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

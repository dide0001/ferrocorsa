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
  background: T.surface,
  border: `1px solid ${T.line}`,
  borderRadius: T.radius,
  padding: 16,
  boxShadow: "0 4px 16px -6px #00000099",
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
        backgroundImage: `linear-gradient(180deg, ${T.bg}cc 0%, ${T.bg} 260px), url(/images/stock/asphalt-texture.jpg)`,
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
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: T.surfaceRaised,
              border: `1px solid ${pushSubscription ? T.accentDim : T.lineBright}`,
              color: pushSubscription ? T.accent : T.textMuted,
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

      <h1 className="disp" style={{ fontSize: 22, margin: "16px 0 0" }}>
        Benvenuto, <span style={{ color: T.accent }}>Pilota</span>.
      </h1>
      <span style={{ fontSize: 12.5, color: T.textMuted, textTransform: "capitalize", display: "block", marginTop: 4 }}>
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
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 18 }}>
            <ScoreRing />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <StatRow label="Strength" />
              <StatRow label="Endurance" />
              <StatRow label="Recovery" />
            </div>
          </div>

          <SectionLabel>Denne uge</SectionLabel>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="disp mono" style={{ fontSize: 28, fontStyle: "normal", transform: "none" }}>
                {completedThisWeek.length}
              </span>
              <span style={{ color: T.textMuted, fontSize: 13 }}>/ {WEEKLY_GOAL} træninger</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: 24,
                      borderRadius: 5,
                      background: doneDays.has(i) ? T.accent : T.surfaceRaised,
                      border: `1px solid ${doneDays.has(i) ? T.accent : T.line}`,
                    }}
                  />
                  <span style={{ fontSize: 9.5, color: T.textFaint, marginTop: 3, display: "block" }}>{label}</span>
                </div>
              ))}
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
                  width: 40,
                  height: 40,
                  borderRadius: T.radiusSm,
                  background: T.accent,
                  color: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
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
              <span style={{ color: T.accent, fontSize: 20 }}>→</span>
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
  const size = 84;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
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
        <span style={{ fontSize: 9, color: T.textFaint, lineHeight: 1.2 }}>Kommer</span>
        <span style={{ fontSize: 9, color: T.textFaint, lineHeight: 1.2 }}>snart</span>
      </div>
    </div>
  );
}

function StatRow({ label }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span className="mono" style={{ fontSize: 13, color: T.textFaint }}>—</span>
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
        margin: "22px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

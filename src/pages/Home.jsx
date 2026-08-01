import { useEffect, useState } from "react";
import { T } from "../theme";
import { getWorkouts, getCompletedWorkouts } from "../api";

const WEEKLY_GOAL = 4;
const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>
            Benvenuto, <span style={{ color: T.accent }}>Pilota</span>.
          </h1>
          <span style={{ fontSize: 12.5, color: T.textMuted, textTransform: "capitalize", display: "block", marginTop: 6 }}>
            {today}
          </span>
        </div>
        {notifPermission !== "unsupported" && (
          <button
            type="button"
            onClick={enablePush}
            disabled={!!pushSubscription}
            aria-label="Aktivér push-notifikationer"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: T.surfaceRaised,
              border: `1px solid ${pushSubscription ? T.accentDim : T.lineBright}`,
              color: pushSubscription ? T.accent : T.textMuted,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {pushSubscription ? "🔔" : "🔕"}
          </button>
        )}
      </div>
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
          <SectionLabel>Denne uge</SectionLabel>
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.line}`,
              borderLeft: `4px solid ${T.accent}`,
              padding: "16px 16px 14px",
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
            }}
          >
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
                width: "100%",
                textAlign: "left",
                background: T.surface,
                border: `1px solid ${T.line}`,
                borderLeft: `4px solid ${T.accent}`,
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
              }}
            >
              <div>
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

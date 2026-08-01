import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { subscribeToPush, getStoredSubscription } from "./push";

// ---- Design tokens ----
// Ferrari-inspired: near-black background, a single sharp rosso corsa accent,
// condensed italic display type, angled card corners borrowed from racing
// livery panels, and deliberate motion — entrance choreography, hover
// response, a "lights out" pulse on log. Plate-color dots stay as a
// functional signature that encodes real load intensity, not decoration.
const T = {
  bg: "#0E0F10",
  surface: "#17181A",
  surfaceRaised: "#1E2022",
  line: "#2A2C2F",
  lineBright: "#3A3D40",
  text: "#F5F5F0",
  textMuted: "#85888C",
  textFaint: "#4C4F52",
  accent: "#FF2800",
  accentDim: "#8C0000",
};

const PLATES = [
  { max: 9, color: "#F5F5F0", label: "5" },
  { max: 14, color: "#4FAE63", label: "10" },
  { max: 19, color: "#E8C547", label: "15" },
  { max: 24, color: "#3E7BE0", label: "20" },
  { max: Infinity, color: "#D9463A", label: "25+" },
];

function plateColor(weight) {
  const w = Number(weight) || 0;
  return (PLATES.find((p) => w <= p.max) || PLATES[PLATES.length - 1]).color;
}

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const STARTER_EXERCISES = ["Squat", "Bænkpres", "Dødløft"];
const DEFAULT_REST_SECONDS = 120;

// ---- Small hook: animate a number counting up whenever its target changes ----
function useCountUp(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = i === 0 ? 880 : 1108;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.18);
    });
    setTimeout(() => ctx.close(), 600);
  } catch (e) {
    // Web Audio not available — fail silently, vibration/push still try.
  }
}

// Ask the backend to deliver a real push notification ~2 minutes from now,
// via Upstash QStash, so it arrives even if the phone is locked or the app
// is closed. Silently no-ops if the user hasn't enabled push yet.
async function scheduleRestPush(subscription, exerciseName) {
  if (!subscription) return;
  try {
    await fetch("/api/schedule-rest-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, exerciseName }),
    });
  } catch (e) {
    // Best-effort — the visual timer still works without the network call.
  }
}

export default function TrainingLog() {
  const [exercises, setExercises] = useState(() =>
    STARTER_EXERCISES.map((name) => ({ id: uid(), name, sets: [] }))
  );
  const [newExerciseName, setNewExerciseName] = useState("");
  const [timer, setTimer] = useState(null);
  const [justLogged, setJustLogged] = useState(null); // exerciseId flash pulse
  const [mounted, setMounted] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [pushSubscription, setPushSubscription] = useState(() => getStoredSubscription());
  const [pushError, setPushError] = useState(null);
  const intervalRef = useRef(null);
  const prevDoneRef = useRef(false);

  async function enablePush() {
    setPushError(null);
    try {
      const subscription = await subscribeToPush();
      setPushSubscription(subscription);
      setNotifPermission(Notification.permission);
    } catch (e) {
      setPushError(e.message || "Kunne ikke aktivere push");
    }
  }

  // Local "rest over" feedback (beep + vibration) fires only while the app
  // is open in the foreground. The actual notification — the one that has
  // to reach a locked phone — is scheduled server-side via QStash the
  // moment the set is logged, see scheduleRestPush() in addSet().
  useEffect(() => {
    const isDone = !!(timer && timer.done);
    if (isDone && !prevDoneRef.current) {
      playBeep();
      if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    }
    prevDoneRef.current = isDone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer && timer.done]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const totalVolume = useMemo(() => {
    return exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((s, set) => s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0)
      );
    }, 0);
  }, [exercises]);

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    [exercises]
  );

  const volumeDisplay = useCountUp(totalVolume);
  const setsDisplay = useCountUp(totalSets);

  const startTimer = useCallback((seconds) => {
    setTimer({ total: seconds, remaining: seconds, running: true, done: false });
  }, []);

  const adjustTimer = useCallback((delta) => {
    setTimer((t) => {
      if (!t) return t;
      const remaining = Math.max(0, t.remaining + delta);
      const total = Math.max(t.total, remaining);
      return { ...t, remaining, total, done: remaining === 0 };
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setTimer((t) => (t ? { ...t, running: !t.running } : t));
  }, []);

  const dismissTimer = useCallback(() => setTimer(null), []);

  useEffect(() => {
    if (!timer || !timer.running) return;
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (!t) return t;
        if (t.remaining <= 1) {
          return { ...t, remaining: 0, running: false, done: true };
        }
        return { ...t, remaining: t.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timer && timer.running]);

  function addExercise() {
    const name = newExerciseName.trim();
    if (!name) return;
    setExercises((prev) => [...prev, { id: uid(), name, sets: [] }]);
    setNewExerciseName("");
  }

  function removeExercise(id) {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }

  function addSet(exerciseId, exerciseName, reps, weight) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { id: uid(), reps, weight }] }
          : ex
      )
    );
    startTimer(DEFAULT_REST_SECONDS);
    scheduleRestPush(pushSubscription, exerciseName);
    setJustLogged(exerciseId);
    setTimeout(() => setJustLogged(null), 420);
  }

  function removeSet(exerciseId, setId) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex
      )
    );
  }

  const today = new Date().toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      style={{
        minHeight: "100%",
        background: T.bg,
        color: T.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        * { box-sizing: border-box; }
        .disp { font-family: 'Archivo Black', system-ui, sans-serif; text-transform: uppercase; font-style: italic; transform: skewX(-4deg); display: inline-block; }
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        input:focus, button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        button { cursor: pointer; transition: transform 150ms cubic-bezier(.2,.8,.2,1), box-shadow 150ms ease, border-color 150ms ease, background 150ms ease, color 150ms ease; }
        button:hover { transform: translateY(-1px); }
        button:active { transform: translateY(0) scale(0.97); }
        .btn-accent:hover { box-shadow: 0 0 0 1px ${T.accent}, 0 4px 18px -4px ${T.accent}88; }
        .btn-ghost:hover { border-color: ${T.accent} !important; color: ${T.accent} !important; }
        ::selection { background: ${T.accent}; color: ${T.bg}; }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUpBar {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes flashPulse {
          0% { box-shadow: inset 0 0 0 0px ${T.accent}00; }
          30% { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accent}14; }
          100% { box-shadow: inset 0 0 0 0px ${T.accent}00; background: transparent; }
        }
        @keyframes pulseRing { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes sweepBg { from { background-position: 0 0; } to { background-position: 300px 0; } }

        .mount-header { animation: dropIn 480ms cubic-bezier(.2,.8,.2,1) both; }
        .mount-card { opacity: 0; animation: riseIn 420ms cubic-bezier(.2,.8,.2,1) both; }
        .just-logged { animation: flashPulse 420ms ease-out; }
        .timer-bar-enter { animation: slideUpBar 320ms cubic-bezier(.2,.8,.2,1) both; }
        .speed-sweep { animation: sweepBg 6s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .pulse, .mount-header, .mount-card, .just-logged, .timer-bar-enter, .speed-sweep { animation: none !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", position: "relative", paddingBottom: timer ? 108 : 0 }}>
        {/* Header */}
        <div
          className={mounted ? "mount-header" : undefined}
          style={{
            padding: "30px 20px 24px",
            borderBottom: `2px solid ${T.accent}`,
            position: "sticky",
            top: 0,
            background: T.bg,
            zIndex: 10,
            overflow: "hidden",
          }}
        >
          <div
            className="speed-sweep"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.5,
              backgroundImage: `repeating-linear-gradient(115deg, transparent 0 22px, ${T.line} 22px 23px)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="disp" style={{ fontSize: 30, margin: 0, lineHeight: 1, color: T.text }}>
                Ferro<span style={{ color: T.accent }}>Corsa</span>
              </h1>
              <span style={{ fontSize: 12.5, color: T.textMuted, textTransform: "capitalize", display: "block", marginTop: 8 }}>
                {today}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <PlateLegend />
              {notifPermission !== "unsupported" && (
                <button
                  type="button"
                  onClick={enablePush}
                  disabled={!!pushSubscription}
                  className="btn-ghost"
                  style={{
                    background: "transparent",
                    border: `1px solid ${pushSubscription ? T.accentDim : T.lineBright}`,
                    color: pushSubscription ? T.accent : T.textMuted,
                    fontSize: 10.5,
                    padding: "4px 8px",
                    letterSpacing: "0.03em",
                    cursor: pushSubscription ? "default" : "pointer",
                  }}
                >
                  {pushSubscription ? "🔔 Ping til" : "🔕 Aktivér ping"}
                </button>
              )}
              {pushError && (
                <span style={{ fontSize: 9.5, color: "#D9463A", maxWidth: 140, textAlign: "right" }}>{pushError}</span>
              )}
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", gap: 22, marginTop: 20 }}>
            <Stat label="Sæt" value={Math.round(setsDisplay)} />
            <Stat label="Volumen" value={`${Math.round(volumeDisplay).toLocaleString("da-DK")} kg`} />
            <Stat label="Øvelser" value={exercises.length} />
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ padding: "18px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
          {exercises.length === 0 && (
            <div style={{ textAlign: "center", color: T.textMuted, padding: "48px 12px", fontSize: 14, lineHeight: 1.6 }}>
              Ingen øvelser endnu.
              <br />
              Tilføj din første øvelse nedenfor for at komme i gang.
            </div>
          )}

          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              flashed={justLogged === ex.id}
              onAddSet={(reps, weight) => addSet(ex.id, ex.name, reps, weight)}
              onRemoveSet={(setId) => removeSet(ex.id, setId)}
              onRemoveExercise={() => removeExercise(ex.id)}
            />
          ))}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 6,
              padding: 12,
              background: T.surface,
              border: `1px dashed ${T.lineBright}`,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
            }}
          >
            <input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise()}
              placeholder="Ny øvelse, fx Skulderpres"
              style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: 15, padding: "8px 4px" }}
            />
            <button
              type="button"
              onClick={addExercise}
              className="disp btn-accent"
              style={{ background: T.accent, color: T.bg, border: "none", padding: "8px 18px", fontSize: 12.5 }}
            >
              Tilføj
            </button>
          </div>
        </div>

        {timer && (
          <RestTimerBar timer={timer} onToggle={toggleTimer} onAdjust={adjustTimer} onDismiss={dismissTimer} />
        )}
      </div>
    </div>
  );
}

function PlateLegend() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }} aria-hidden="true">
      {PLATES.map((p, i) => (
        <div key={i} title={`${p.label} kg`} style={{ width: 7, height: 16 + i * 4, background: p.color }} />
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="disp mono" style={{ fontSize: 20, lineHeight: 1, fontStyle: "normal", transform: "none" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, index, flashed, onAddSet, onRemoveSet, onRemoveExercise }) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const bestSet = exercise.sets.reduce((best, s) => {
    const w = Number(s.weight) || 0;
    return !best || w > (Number(best.weight) || 0) ? s : best;
  }, null);

  function submit() {
    if (!reps || !weight) return;
    onAddSet(reps, weight);
    setReps("");
    setWeight("");
  }

  return (
    <div
      className={`mount-card${flashed ? " just-logged" : ""}`}
      style={{
        animationDelay: `${Math.min(index, 6) * 60}ms`,
        background: T.surface,
        border: `1px solid ${T.line}`,
        borderLeft: `3px solid ${T.accent}`,
        overflow: "hidden",
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "13px 14px",
          borderBottom: exercise.sets.length ? `1px solid ${T.line}` : "none",
        }}
      >
        <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700, letterSpacing: "0.01em" }}>{exercise.name}</h2>
        <button
          onClick={onRemoveExercise}
          aria-label={`Fjern ${exercise.name}`}
          style={{ background: "none", border: "none", color: T.textMuted, fontSize: 18, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>

      {exercise.sets.length > 0 && (
        <div style={{ padding: "6px 14px 2px" }}>
          {exercise.sets.map((s, i) => {
            const isBest = bestSet && s.id === bestSet.id && exercise.sets.length > 1;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", fontSize: 14 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: "50%", background: plateColor(s.weight), flexShrink: 0 }} />
                <span style={{ color: T.textFaint, width: 16, fontSize: 12.5 }}>{i + 1}</span>
                <span className="mono" style={{ flex: 1 }}>
                  {s.reps} × {s.weight} kg
                </span>
                {isBest && (
                  <span className="disp" style={{ fontSize: 9.5, color: T.accent, letterSpacing: "0.04em" }}>
                    top
                  </span>
                )}
                <button
                  onClick={() => onRemoveSet(s.id)}
                  aria-label="Fjern sæt"
                  style={{ background: "none", border: "none", color: T.textFaint, fontSize: 14, padding: "2px 4px" }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, padding: "10px 14px 14px" }}>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Reps"
          style={{ width: 68, background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "8px 10px", fontSize: 14 }}
        />
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Kg"
          style={{ width: 68, background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "8px 10px", fontSize: 14 }}
        />
        <button
          type="button"
          onClick={submit}
          className="disp btn-ghost"
          style={{ flex: 1, background: "transparent", border: `1px solid ${T.accent}`, color: T.accent, fontSize: 12.5 }}
        >
          Log sæt
        </button>
      </div>
    </div>
  );
}

function RestTimerBar({ timer, onToggle, onAdjust, onDismiss }) {
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
        left: "50%",
        bottom: 0,
        width: "100%",
        maxWidth: 480,
        background: T.surface,
        borderTop: `2px solid ${ringColor}`,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 20,
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

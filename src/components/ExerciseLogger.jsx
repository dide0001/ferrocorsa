import { useState } from "react";
import { T, plateColor } from "../theme";

export default function ExerciseLogger({ exercise, loggedSets, index, flashed, onAddSet, onRemoveSet }) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const bestSet = loggedSets.reduce((best, s) => {
    const w = Number(s.weight) || 0;
    return !best || w > (Number(best.weight) || 0) ? s : best;
  }, null);

  const complete = loggedSets.length >= exercise.targetSets;

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
        backgroundImage: `repeating-linear-gradient(45deg, #ffffff05 0 1px, transparent 1px 7px)`,
        border: `1px solid ${T.line}`,
        borderLeft: `4px solid ${complete ? "#4FAE63" : T.accent}`,
        boxShadow: "inset 4px 0 0 0 #000",
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
          borderBottom: loggedSets.length ? `1px solid ${T.line}` : "none",
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700, letterSpacing: "0.01em" }}>{exercise.name}</h2>
          <span className="mono" style={{ fontSize: 12, color: T.textMuted }}>
            {loggedSets.length}/{exercise.targetSets} × {exercise.targetReps}
          </span>
        </div>
        <span
          aria-hidden="true"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
            background: complete ? "#4FAE63" : "transparent",
            border: complete ? "none" : `1.5px solid ${T.lineBright}`,
            color: complete ? T.bg : "transparent",
          }}
        >
          ✓
        </span>
      </div>

      {loggedSets.length > 0 && (
        <div style={{ padding: "6px 14px 2px" }}>
          {loggedSets.map((s, i) => {
            const isBest = bestSet && s.id === bestSet.id && loggedSets.length > 1;
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

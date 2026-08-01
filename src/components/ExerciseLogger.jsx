import { useState } from "react";
import { T, plateColor } from "../theme";

export default function ExerciseLogger({ exercise, loggedSets, index, flashed, onAddSet, onRemoveSet }) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [expanded, setExpanded] = useState(false);

  const bestSet = loggedSets.reduce((best, s) => {
    const w = Number(s.weight) || 0;
    return !best || w > (Number(best.weight) || 0) ? s : best;
  }, null);

  const complete = loggedSets.length >= exercise.targetSets;
  const hasDetails = (exercise.instructions?.length || 0) > 0 || (exercise.primaryMuscles?.length || 0) > 0;

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
        borderLeft: `4px solid ${complete ? "#4FAE63" : T.accent}`,
        borderRadius: T.radius,
        overflow: "hidden",
        boxShadow: "0 2px 10px -4px #00000088",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: loggedSets.length ? `1px solid ${T.line}` : "none",
        }}
      >
        {exercise.thumbnail || exercise.images?.[0] ? (
          <img
            src={exercise.thumbnail || exercise.images[0]}
            alt=""
            style={{ width: 40, height: 40, borderRadius: T.radiusSm, objectFit: "cover", flexShrink: 0, background: T.surfaceRaised }}
          />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: T.surfaceRaised, flexShrink: 0 }} />
        )}

        <button
          type="button"
          onClick={() => hasDetails && setExpanded((v) => !v)}
          style={{ flex: 1, textAlign: "left", background: "none", border: "none", padding: 0, cursor: hasDetails ? "pointer" : "default" }}
        >
          <h2 style={{ fontSize: 15, margin: 0, fontWeight: 700, letterSpacing: "0.01em" }}>
            {exercise.name}
            {hasDetails && <span style={{ color: T.textFaint, fontSize: 11, marginLeft: 6 }}>{expanded ? "▲" : "▼"}</span>}
          </h2>
          <span className="mono" style={{ fontSize: 12, color: T.textMuted }}>
            {loggedSets.length}/{exercise.targetSets} × {exercise.targetReps}
          </span>
        </button>

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

      {expanded && hasDetails && (
        <div style={{ padding: "10px 14px", background: T.surfaceRaised, borderBottom: `1px solid ${T.line}` }}>
          {exercise.primaryMuscles?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {exercise.primaryMuscles.map((m) => (
                <span
                  key={m}
                  className="mono"
                  style={{ fontSize: 10, color: T.accent, border: `1px solid ${T.accentDim}`, borderRadius: 6, padding: "2px 7px", textTransform: "uppercase" }}
                >
                  {m}
                </span>
              ))}
            </div>
          )}
          {exercise.instructions?.length > 0 && (
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
              {exercise.instructions.map((step, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

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
          style={{ width: 68, background: T.surfaceRaised, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, color: T.text, padding: "8px 10px", fontSize: 14 }}
        />
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Kg"
          style={{ width: 68, background: T.surfaceRaised, border: `1px solid ${T.line}`, borderRadius: T.radiusSm, color: T.text, padding: "8px 10px", fontSize: 14 }}
        />
        <button
          type="button"
          onClick={submit}
          className="disp btn-ghost"
          style={{ flex: 1, background: "transparent", border: `1px solid ${T.accent}`, borderRadius: T.radiusSm, color: T.accent, fontSize: 12.5 }}
        >
          Log sæt
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { T } from "../theme";
import { getWorkouts, createWorkout, deleteWorkout } from "../api";

function blankExerciseRow() {
  return { key: Math.random().toString(36).slice(2), name: "", targetSets: "3", targetReps: "10" };
}

export default function Workouts({ onOpenWorkout }) {
  const [workouts, setWorkouts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rows, setRows] = useState([blankExerciseRow()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getWorkouts()
      .then((w) => !cancelled && (setWorkouts(w), setStatus("ready")))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRow(key, field, value) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function removeRow(key) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function submit() {
    setFormError(null);
    const trimmedName = name.trim();
    const exercises = rows
      .map((r) => ({ name: r.name.trim(), targetSets: Number(r.targetSets), targetReps: Number(r.targetReps) }))
      .filter((e) => e.name);

    if (!trimmedName) return setFormError("Workout skal have et navn");
    if (exercises.length === 0) return setFormError("Tilføj mindst én øvelse");

    setSaving(true);
    try {
      const created = await createWorkout({ name: trimmedName, category: "Custom", exercises });
      setWorkouts((prev) => [...prev, created]);
      setName("");
      setRows([blankExerciseRow()]);
      setShowForm(false);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    try {
      await deleteWorkout(id);
    } catch (e) {
      // Best-effort — worst case it reappears on next full reload.
    }
  }

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 32px" }}>
      <h1 className="disp" style={{ fontSize: 22, margin: 0 }}>Workouts</h1>

      {status === "loading" && (
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 40, textAlign: "center" }}>Henter workouts…</div>
      )}
      {status === "error" && (
        <div style={{ color: "#D9463A", fontSize: 13, marginTop: 40, textAlign: "center" }}>
          Kunne ikke hente workouts. Prøv igen senere.
        </div>
      )}

      {status === "ready" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          {workouts.map((w) => (
            <div
              key={w.id}
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
                borderLeft: `4px solid ${T.accent}`,
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
              }}
            >
              <button
                type="button"
                onClick={() => onOpenWorkout(w.id)}
                style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: 0 }}
              >
                {w.image && (
                  <img src={w.image} alt="" style={{ display: "block", width: "100%", height: 90, objectFit: "cover" }} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: 16 }}>
                  <div>
                    <div className="disp" style={{ fontSize: 15 }}>{w.name}</div>
                    {w.description && (
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, maxWidth: 280 }}>{w.description}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 6 }}>
                      {w.exercises.length} øvelser · {w.category}
                    </div>
                  </div>
                  <span style={{ color: T.accent, fontSize: 18 }}>→</span>
                </div>
              </button>
              {w.category === "Custom" && (
                <div style={{ padding: "0 16px 12px", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => remove(w.id)}
                    style={{ background: "none", border: "none", color: T.textFaint, fontSize: 11.5 }}
                  >
                    Slet workout
                  </button>
                </div>
              )}
            </div>
          ))}

          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="disp btn-ghost"
              style={{ background: "transparent", border: `1px dashed ${T.lineBright}`, color: T.textMuted, padding: "12px", fontSize: 12.5, marginTop: 6 }}
            >
              + Ny workout
            </button>
          )}

          {showForm && (
            <div style={{ background: T.surface, border: `1px dashed ${T.lineBright}`, padding: 14, marginTop: 6 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Navn, fx Arm Day"
                style={{ width: "100%", background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "8px 10px", fontSize: 14, marginBottom: 10 }}
              />

              {rows.map((r) => (
                <div key={r.key} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    value={r.name}
                    onChange={(e) => updateRow(r.key, "name", e.target.value)}
                    placeholder="Øvelse"
                    style={{ flex: 1, background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "7px 8px", fontSize: 13 }}
                  />
                  <input
                    type="number"
                    min="1"
                    value={r.targetSets}
                    onChange={(e) => updateRow(r.key, "targetSets", e.target.value)}
                    placeholder="Sæt"
                    style={{ width: 52, background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "7px 8px", fontSize: 13 }}
                  />
                  <input
                    type="number"
                    min="1"
                    value={r.targetReps}
                    onChange={(e) => updateRow(r.key, "targetReps", e.target.value)}
                    placeholder="Reps"
                    style={{ width: 52, background: T.surfaceRaised, border: `1px solid ${T.line}`, color: T.text, padding: "7px 8px", fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    style={{ background: "none", border: "none", color: T.textFaint, fontSize: 16, padding: "0 4px" }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, blankExerciseRow()])}
                style={{ background: "none", border: "none", color: T.textMuted, fontSize: 12, padding: "4px 0", textAlign: "left" }}
              >
                + Tilføj øvelse
              </button>

              {formError && <div style={{ color: "#D9463A", fontSize: 12, marginTop: 6 }}>{formError}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "transparent", border: `1px solid ${T.line}`, color: T.textMuted, padding: "9px", fontSize: 12.5 }}
                >
                  Annullér
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="disp btn-accent"
                  style={{ flex: 1, background: T.accent, color: T.bg, border: "none", padding: "9px", fontSize: 12.5 }}
                >
                  {saving ? "Gemmer…" : "Gem workout"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

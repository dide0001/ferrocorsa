import { useEffect, useMemo, useRef, useState } from "react";
import { T, uid } from "../theme";
import { getWorkouts, logCompletedWorkout } from "../api";
import { scheduleRestPush } from "../usePush";
import ExerciseLogger from "../components/ExerciseLogger";
import { DEFAULT_REST_SECONDS } from "../useRestTimer";

export default function WorkoutDetail({ workoutId, onBack, startTimer, pushSubscription }) {
  const [workout, setWorkout] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loggedByExercise, setLoggedByExercise] = useState({});
  const [justLogged, setJustLogged] = useState(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const loggedCompletionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getWorkouts()
      .then((all) => {
        if (cancelled) return;
        const found = all.find((w) => w.id === workoutId);
        setWorkout(found || null);
        setStatus(found ? "ready" : "not-found");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  const allComplete = useMemo(() => {
    if (!workout) return false;
    return workout.exercises.every((ex) => (loggedByExercise[ex.id]?.length || 0) >= ex.targetSets);
  }, [workout, loggedByExercise]);

  useEffect(() => {
    if (!workout || !allComplete || loggedCompletionRef.current) return;
    loggedCompletionRef.current = true;
    setJustCompleted(true);
    logCompletedWorkout(workout.id).catch(() => {});
  }, [allComplete, workout]);

  function addSet(exercise, reps, weight) {
    setLoggedByExercise((prev) => ({
      ...prev,
      [exercise.id]: [...(prev[exercise.id] || []), { id: uid(), reps, weight }],
    }));
    startTimer(DEFAULT_REST_SECONDS);
    scheduleRestPush(pushSubscription, exercise.name);
    setJustLogged(exercise.id);
    setTimeout(() => setJustLogged(null), 420);
  }

  function removeSet(exerciseId, setId) {
    setLoggedByExercise((prev) => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).filter((s) => s.id !== setId),
    }));
  }

  if (status === "loading") {
    return (
      <div style={{ padding: "calc(40px + env(safe-area-inset-top)) 20px", textAlign: "center", color: T.textMuted, fontSize: 13 }}>
        Henter workout…
      </div>
    );
  }
  if (status === "not-found" || status === "error") {
    return (
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px" }}>
        <BackButton onBack={onBack} />
        <div style={{ color: "#D9463A", fontSize: 13, marginTop: 30, textAlign: "center" }}>
          Kunne ikke finde denne workout.
        </div>
      </div>
    );
  }

  const totalTargetSets = workout.exercises.reduce((sum, ex) => sum + ex.targetSets, 0);

  return (
    <div style={{ paddingBottom: 20 }}>
      {workout.image && (
        <img src={workout.image} alt="" style={{ display: "block", width: "100%", height: 130, objectFit: "cover" }} />
      )}
      <div
        style={{
          padding: "16px 20px 20px",
          borderBottom: `3px solid ${T.accent}`,
          boxShadow: "0 3px 0 0 #000",
          background: T.surface,
        }}
      >
        <BackButton onBack={onBack} />
        <h1 className="disp" style={{ fontSize: 24, margin: "10px 0 4px" }}>{workout.name}</h1>
        {workout.description && (
          <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 12px" }}>{workout.description}</p>
        )}
        <div style={{ display: "flex", gap: 20 }}>
          <MiniStat label="Øvelser" value={workout.exercises.length} />
          <MiniStat label="Mål-sæt" value={totalTargetSets} />
          <MiniStat label="Kategori" value={workout.category} />
        </div>
        {workout.muscleGroups?.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {workout.muscleGroups.map((mg) => (
              <span
                key={mg}
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: T.textMuted,
                  border: `1px solid ${T.lineBright}`,
                  padding: "2px 8px",
                  textTransform: "uppercase",
                }}
              >
                {mg}
              </span>
            ))}
          </div>
        )}
      </div>

      {justCompleted && (
        <div
          className="disp"
          style={{
            margin: "16px 20px 0",
            padding: "12px 14px",
            background: "#4FAE6322",
            border: "1px solid #4FAE63",
            color: "#4FAE63",
            fontSize: 13,
          }}
        >
          Workout gennemført 💪
        </div>
      )}

      <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {workout.exercises.map((ex, i) => (
          <ExerciseLogger
            key={ex.id}
            exercise={ex}
            index={i}
            loggedSets={loggedByExercise[ex.id] || []}
            flashed={justLogged === ex.id}
            onAddSet={(reps, weight) => addSet(ex, reps, weight)}
            onRemoveSet={(setId) => removeSet(ex.id, setId)}
          />
        ))}
      </div>
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 13, padding: 0 }}>
      ← Tilbage
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="disp mono" style={{ fontSize: 16, fontStyle: "normal", transform: "none" }}>{value}</div>
      <div style={{ fontSize: 9.5, color: T.textMuted, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

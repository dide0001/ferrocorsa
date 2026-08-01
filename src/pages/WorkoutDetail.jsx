import { useEffect, useMemo, useRef, useState } from "react";
import { T, uid } from "../theme";
import { getWorkouts, getExercise, logCompletedWorkout } from "../api";
import { scheduleRestPush } from "../usePush";
import ExerciseLogger from "../components/ExerciseLogger";
import { DEFAULT_REST_SECONDS } from "../useRestTimer";

export default function WorkoutDetail({ workoutId, onBack, startTimer, pushSubscription }) {
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]); // { exerciseId, targetSets, targetReps, ...libraryRecord }
  const [status, setStatus] = useState("loading");
  const [loggedByExercise, setLoggedByExercise] = useState({});
  const [justLogged, setJustLogged] = useState(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const loggedCompletionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getWorkouts()
      .then(async (all) => {
        const found = all.find((w) => w.id === workoutId);
        if (!found) {
          if (!cancelled) setStatus("not-found");
          return;
        }
        const details = await Promise.all(
          found.exercises.map((ex) => getExercise(ex.exerciseId).catch(() => null))
        );
        if (cancelled) return;
        setWorkout(found);
        setExercises(
          found.exercises.map((ex, i) => ({
            ...ex,
            ...(details[i] || { name: ex.exerciseId, images: [], instructions: [], primaryMuscles: [] }),
          }))
        );
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  const allComplete = useMemo(() => {
    if (exercises.length === 0) return false;
    return exercises.every((ex) => (loggedByExercise[ex.exerciseId]?.length || 0) >= ex.targetSets);
  }, [exercises, loggedByExercise]);

  useEffect(() => {
    if (!workout || !allComplete || loggedCompletionRef.current) return;
    loggedCompletionRef.current = true;
    setJustCompleted(true);
    logCompletedWorkout(workout.id).catch(() => {});
  }, [allComplete, workout]);

  function addSet(exercise, reps, weight) {
    setLoggedByExercise((prev) => ({
      ...prev,
      [exercise.exerciseId]: [...(prev[exercise.exerciseId] || []), { id: uid(), reps, weight }],
    }));
    startTimer(DEFAULT_REST_SECONDS);
    scheduleRestPush(pushSubscription, exercise.name);
    setJustLogged(exercise.exerciseId);
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

  const totalTargetSets = exercises.reduce((sum, ex) => sum + ex.targetSets, 0);

  return (
    <div style={{ paddingBottom: 20 }}>
      {workout.image && (
        <div style={{ position: "relative", height: 170 }}>
          <img
            src={workout.image}
            alt=""
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${T.bg}22 0%, transparent 35%, ${T.surface} 100%), linear-gradient(90deg, ${T.accentDim}33, transparent 60%)`,
            }}
          />
        </div>
      )}
      <div
        style={{
          padding: "16px 20px 20px",
          borderBottom: `1px solid ${T.line}`,
          background: T.surface,
        }}
      >
        <BackButton onBack={onBack} />
        <h1 className="disp" style={{ fontSize: 24, margin: "10px 0 4px" }}>{workout.name}</h1>
        {workout.description && (
          <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 12px" }}>{workout.description}</p>
        )}
        <div style={{ display: "flex", gap: 20 }}>
          <MiniStat label="Øvelser" value={exercises.length} />
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
        {exercises.map((ex, i) => (
          <ExerciseLogger
            key={ex.exerciseId}
            exercise={ex}
            index={i}
            loggedSets={loggedByExercise[ex.exerciseId] || []}
            flashed={justLogged === ex.exerciseId}
            onAddSet={(reps, weight) => addSet(ex, reps, weight)}
            onRemoveSet={(setId) => removeSet(ex.exerciseId, setId)}
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

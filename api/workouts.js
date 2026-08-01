import { randomUUID } from "node:crypto";
import { redis } from "../lib/redis.js";

// exerciseId values reference records imported by scripts/import-exercises.mjs
// (Free Exercise DB ids) — resolved to full name/image/instructions client-side.
const DEFAULT_WORKOUTS = [
  {
    id: "seed-leg-day",
    name: "Leg Day",
    category: "Strength",
    description: "Fokus på quads, baglår og baller — tunge composite-øvelser først.",
    image: "/images/stock/tire-tread.jpg",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    exercises: [
      { exerciseId: "Barbell_Squat", targetSets: 4, targetReps: 8 },
      { exerciseId: "Romanian_Deadlift", targetSets: 4, targetReps: 10 },
      { exerciseId: "Leg_Press", targetSets: 3, targetReps: 12 },
      { exerciseId: "Barbell_Walking_Lunge", targetSets: 3, targetReps: 20 },
    ],
  },
  {
    id: "seed-push-day",
    name: "Push Day",
    category: "Strength",
    description: "Bryst, skuldre og triceps. Byg trykkraften op.",
    image: "/images/stock/speedometer.jpg",
    muscleGroups: ["chest", "shoulders", "triceps"],
    exercises: [
      { exerciseId: "Barbell_Bench_Press_-_Medium_Grip", targetSets: 4, targetReps: 8 },
      { exerciseId: "Standing_Military_Press", targetSets: 4, targetReps: 10 },
      { exerciseId: "Incline_Dumbbell_Press", targetSets: 3, targetReps: 12 },
      { exerciseId: "Triceps_Pushdown", targetSets: 3, targetReps: 15 },
    ],
  },
  {
    id: "seed-pull-day",
    name: "Pull Day",
    category: "Strength",
    description: "Ryg og biceps. Tungt håndtag, kontrolleret excentrisk.",
    image: "/images/stock/tachometer.jpg",
    muscleGroups: ["back", "biceps"],
    exercises: [
      { exerciseId: "Barbell_Deadlift", targetSets: 4, targetReps: 6 },
      { exerciseId: "Pullups", targetSets: 4, targetReps: 8 },
      { exerciseId: "Bent_Over_Barbell_Row", targetSets: 3, targetReps: 10 },
      { exerciseId: "Barbell_Curl", targetSets: 3, targetReps: 12 },
    ],
  },
];

async function getOrSeedWorkouts() {
  const stored = await redis.get("workouts");
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  await redis.set("workouts", DEFAULT_WORKOUTS);
  return DEFAULT_WORKOUTS;
}

function normalizeExercise(e) {
  return {
    exerciseId: String(e.exerciseId || "").trim(),
    targetSets: Math.max(1, Number(e.targetSets) || 3),
    targetReps: Math.max(1, Number(e.targetReps) || 10),
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const workouts = await getOrSeedWorkouts();
    return res.status(200).json(workouts);
  }

  if (req.method === "POST") {
    const { name, category, description, image, muscleGroups, exercises } = req.body || {};
    if (!name || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "Missing name or exercises" });
    }
    const workouts = await getOrSeedWorkouts();
    const workout = {
      id: randomUUID(),
      name: String(name).trim(),
      category: category || "Custom",
      description: description || "",
      image: image || "/images/workouts/custom.svg",
      muscleGroups: Array.isArray(muscleGroups) ? muscleGroups : [],
      exercises: exercises.map(normalizeExercise),
    };
    await redis.set("workouts", [...workouts, workout]);
    return res.status(201).json(workout);
  }

  if (req.method === "PUT") {
    const { id, exercises, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing id" });
    const workouts = await getOrSeedWorkouts();
    const idx = workouts.findIndex((w) => w.id === id);
    if (idx === -1) return res.status(404).json({ error: "Workout not found" });
    const updated = {
      ...workouts[idx],
      ...updates,
      id,
      exercises: Array.isArray(exercises) ? exercises.map(normalizeExercise) : workouts[idx].exercises,
    };
    workouts[idx] = updated;
    await redis.set("workouts", workouts);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const workouts = await getOrSeedWorkouts();
    await redis.set("workouts", workouts.filter((w) => w.id !== id));
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}

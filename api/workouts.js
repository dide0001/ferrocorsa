import { randomUUID } from "node:crypto";
import { redis } from "../lib/redis.js";

const DEFAULT_WORKOUTS = [
  {
    id: "seed-leg-day",
    name: "Leg Day",
    category: "Strength",
    description: "Fokus på quads, baglår og baller — tunge composite-øvelser først.",
    image: "/images/workouts/leg-day.svg",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    exercises: [
      { id: "seed-leg-1", name: "Barbell Squat", targetSets: 4, targetReps: 8 },
      { id: "seed-leg-2", name: "Romanian Deadlift", targetSets: 4, targetReps: 10 },
      { id: "seed-leg-3", name: "Leg Press", targetSets: 3, targetReps: 12 },
      { id: "seed-leg-4", name: "Walking Lunges", targetSets: 3, targetReps: 20 },
    ],
  },
  {
    id: "seed-push-day",
    name: "Push Day",
    category: "Strength",
    description: "Bryst, skuldre og triceps. Byg trykkraften op.",
    image: "/images/workouts/push-day.svg",
    muscleGroups: ["chest", "shoulders", "triceps"],
    exercises: [
      { id: "seed-push-1", name: "Bench Press", targetSets: 4, targetReps: 8 },
      { id: "seed-push-2", name: "Overhead Press", targetSets: 4, targetReps: 10 },
      { id: "seed-push-3", name: "Incline Dumbbell Press", targetSets: 3, targetReps: 12 },
      { id: "seed-push-4", name: "Triceps Pushdown", targetSets: 3, targetReps: 15 },
    ],
  },
  {
    id: "seed-pull-day",
    name: "Pull Day",
    category: "Strength",
    description: "Ryg og biceps. Tungt håndtag, kontrolleret excentrisk.",
    image: "/images/workouts/pull-day.svg",
    muscleGroups: ["back", "biceps"],
    exercises: [
      { id: "seed-pull-1", name: "Deadlift", targetSets: 4, targetReps: 6 },
      { id: "seed-pull-2", name: "Pull-Up", targetSets: 4, targetReps: 8 },
      { id: "seed-pull-3", name: "Barbell Row", targetSets: 3, targetReps: 10 },
      { id: "seed-pull-4", name: "Barbell Curl", targetSets: 3, targetReps: 12 },
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
    id: e.id || randomUUID(),
    name: String(e.name || "").trim(),
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

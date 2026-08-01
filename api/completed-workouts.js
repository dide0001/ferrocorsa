import { redis } from "../lib/redis.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const entries = (await redis.get("completedWorkouts")) || [];
    return res.status(200).json(entries);
  }

  if (req.method === "POST") {
    const { workoutId } = req.body || {};
    if (!workoutId) return res.status(400).json({ error: "Missing workoutId" });
    const entries = (await redis.get("completedWorkouts")) || [];
    const entry = { workoutId, completedAt: new Date().toISOString() };
    await redis.set("completedWorkouts", [...entries, entry]);
    return res.status(201).json(entry);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}

import { redis } from "../../lib/redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const exercise = await redis.get(`exercise:${id}`);
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });

  res.status(200).json(exercise);
}

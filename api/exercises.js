import { redis } from "../lib/redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const index = (await redis.get("exercises:index")) || [];
  const { q, muscle, category } = req.query;

  let results = index;
  if (q) {
    const needle = String(q).toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(needle));
  }
  if (muscle) {
    const needle = String(muscle).toLowerCase();
    results = results.filter((e) => e.primaryMuscles.some((m) => m.toLowerCase() === needle));
  }
  if (category) {
    const needle = String(category).toLowerCase();
    results = results.filter((e) => (e.category || "").toLowerCase() === needle);
  }

  res.status(200).json(results.slice(0, 100));
}

// One-time/occasional maintenance script: imports the Free Exercise DB
// (https://github.com/yuhonas/free-exercise-db, Unlicense/public domain)
// into Upstash Redis. Images stay hosted on GitHub's raw CDN — we only
// store the resolved URLs, not the image bytes. Safe to re-run.
import { readFileSync } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

const SOURCE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const BATCH_SIZE = 50;

function loadEnvLocal() {
  const envPath = path.resolve(import.meta.dirname, "../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (key) process.env[key] = value;
  }
}

loadEnvLocal();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function resolveImages(images) {
  return (images || []).map((p) => IMAGE_BASE + p);
}

async function main() {
  console.log("Fetching", SOURCE_URL);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`);
  const raw = await res.json();
  console.log(`Fetched ${raw.length} exercises`);

  const index = [];
  const records = [];

  for (const e of raw) {
    const images = resolveImages(e.images);
    index.push({
      id: e.id,
      name: e.name,
      category: e.category,
      equipment: e.equipment,
      primaryMuscles: e.primaryMuscles || [],
      thumbnail: images[0] || null,
    });
    records.push({
      id: e.id,
      name: e.name,
      force: e.force,
      level: e.level,
      mechanic: e.mechanic,
      equipment: e.equipment,
      primaryMuscles: e.primaryMuscles || [],
      secondaryMuscles: e.secondaryMuscles || [],
      instructions: e.instructions || [],
      category: e.category,
      images,
    });
  }

  await redis.set("exercises:index", index);
  console.log("Wrote exercises:index with", index.length, "entries");

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const pipeline = redis.pipeline();
    for (const record of batch) {
      pipeline.set(`exercise:${record.id}`, record);
    }
    await pipeline.exec();
    console.log(`Wrote exercise records ${i + 1}-${i + batch.length} / ${records.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

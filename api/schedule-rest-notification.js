import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subscription, exerciseName } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Missing push subscription" });
  }

  const baseUrl = process.env.PUBLIC_BASE_URL;
  if (!baseUrl) {
    return res.status(500).json({ error: "PUBLIC_BASE_URL is not configured" });
  }

  try {
    await qstash.publishJSON({
      url: `${baseUrl}/api/send-rest-notification`,
      body: { subscription, exerciseName: exerciseName || null },
      delay: 120,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("QStash publish failed", err);
    res.status(502).json({ error: "Could not schedule notification" });
  }
}

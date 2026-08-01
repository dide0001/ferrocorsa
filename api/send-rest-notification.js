import { Receiver } from "@upstash/qstash";
import webpush from "web-push";

// QStash's signature is computed over the exact raw request body, so we
// need the untouched bytes — disable Vercel's automatic JSON body parsing.
export const config = {
  api: {
    bodyParser: false,
  },
};

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["upstash-signature"];

  try {
    const isValid = await receiver.verify({
      signature,
      body: rawBody,
      url: `${process.env.PUBLIC_BASE_URL}/api/send-rest-notification`,
    });
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  const { subscription, exerciseName } = JSON.parse(rawBody);

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Hviletid slut 💪",
        body: exerciseName ? `Klar til næste sæt: ${exerciseName}` : "Klar til næste sæt",
      })
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("web-push send failed", err);
    // 404/410 means the subscription is dead — nothing to retry, report success.
    if (err.statusCode === 404 || err.statusCode === 410) {
      return res.status(200).json({ ok: true, note: "subscription expired" });
    }
    res.status(500).json({ error: "Could not send push" });
  }
}

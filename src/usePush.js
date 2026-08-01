import { useState } from "react";
import { subscribeToPush, getStoredSubscription } from "./push";

export function usePush() {
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [pushSubscription, setPushSubscription] = useState(() => getStoredSubscription());
  const [pushError, setPushError] = useState(null);

  async function enablePush() {
    setPushError(null);
    try {
      const subscription = await subscribeToPush();
      setPushSubscription(subscription);
      setNotifPermission(Notification.permission);
    } catch (e) {
      setPushError(e.message || "Kunne ikke aktivere push");
    }
  }

  return { notifPermission, pushSubscription, pushError, enablePush };
}

// Ask the backend to deliver a real push notification ~2 minutes from now,
// via Upstash QStash, so it arrives even if the phone is locked or the app
// is closed. Silently no-ops if the user hasn't enabled push yet.
export async function scheduleRestPush(subscription, exerciseName) {
  if (!subscription) return;
  try {
    await fetch("/api/schedule-rest-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, exerciseName }),
    });
  } catch (e) {
    // Best-effort — the visual timer still works without the network call.
  }
}

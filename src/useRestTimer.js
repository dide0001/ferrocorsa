import { useCallback, useEffect, useRef, useState } from "react";

export const DEFAULT_REST_SECONDS = 120;

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = i === 0 ? 880 : 1108;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.18);
    });
    setTimeout(() => ctx.close(), 600);
  } catch (e) {
    // Web Audio not available — fail silently, vibration/push still try.
  }
}

// The countdown is derived from a fixed wall-clock target (endAt) rather
// than decremented tick-by-tick, because setInterval stops firing while
// the tab/app is backgrounded or the phone is locked. Recomputing from
// endAt makes the display self-correct the moment it's able to run again,
// instead of showing whatever stale value it was frozen at.
export function useRestTimer() {
  const [timer, setTimer] = useState(null);
  const intervalRef = useRef(null);
  const prevDoneRef = useRef(false);

  const recomputeFromEndAt = useCallback((t) => {
    if (!t || !t.running || !t.endAt) return t;
    const remaining = Math.max(0, Math.round((t.endAt - Date.now()) / 1000));
    if (remaining <= 0) return { ...t, remaining: 0, running: false, done: true, endAt: null };
    return { ...t, remaining };
  }, []);

  const startTimer = useCallback((seconds = DEFAULT_REST_SECONDS) => {
    setTimer({ total: seconds, remaining: seconds, running: true, done: false, endAt: Date.now() + seconds * 1000 });
  }, []);

  const adjustTimer = useCallback((delta) => {
    setTimer((t) => {
      if (!t) return t;
      if (t.running && t.endAt) {
        const endAt = Math.max(Date.now(), t.endAt + delta * 1000);
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        const total = Math.max(t.total, remaining);
        return { ...t, endAt, remaining, total, done: remaining === 0, running: remaining > 0 };
      }
      const remaining = Math.max(0, t.remaining + delta);
      const total = Math.max(t.total, remaining);
      return { ...t, remaining, total, done: remaining === 0 };
    });
  }, []);

  const toggleTimer = useCallback(() => {
    setTimer((t) => {
      if (!t) return t;
      if (t.running) {
        const paused = recomputeFromEndAt(t);
        return { ...paused, running: false, endAt: null };
      }
      return { ...t, running: true, endAt: Date.now() + t.remaining * 1000 };
    });
  }, [recomputeFromEndAt]);

  const dismissTimer = useCallback(() => setTimer(null), []);

  useEffect(() => {
    if (!timer || !timer.running) return;
    intervalRef.current = setInterval(() => {
      setTimer(recomputeFromEndAt);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timer && timer.running, recomputeFromEndAt]);

  // Catch up immediately on resume (unlocking the phone, switching back to
  // the tab) instead of waiting for the next 1s tick, which browsers can
  // delay noticeably right after a tab was backgrounded.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") setTimer(recomputeFromEndAt);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [recomputeFromEndAt]);

  // Local "rest over" feedback (beep + vibration) fires only while the app
  // is open in the foreground. The actual notification — the one that has
  // to reach a locked phone — is scheduled server-side via QStash the
  // moment the set is logged (see scheduleRestPush in src/push.js callers).
  useEffect(() => {
    const isDone = !!(timer && timer.done);
    if (isDone && !prevDoneRef.current) {
      playBeep();
      if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
    }
    prevDoneRef.current = isDone;
  }, [timer && timer.done]);

  return { timer, startTimer, toggleTimer, adjustTimer, dismissTimer };
}

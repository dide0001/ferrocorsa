async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function getWorkouts() {
  return request("/api/workouts");
}

export function createWorkout(workout) {
  return request("/api/workouts", { method: "POST", body: JSON.stringify(workout) });
}

export function updateWorkout(workout) {
  return request("/api/workouts", { method: "PUT", body: JSON.stringify(workout) });
}

export function deleteWorkout(id) {
  return request("/api/workouts", { method: "DELETE", body: JSON.stringify({ id }) });
}

export function getCompletedWorkouts() {
  return request("/api/completed-workouts");
}

export function logCompletedWorkout(workoutId) {
  return request("/api/completed-workouts", { method: "POST", body: JSON.stringify({ workoutId }) });
}

export function getExerciseIndex(query = {}) {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return request(`/api/exercises${qs ? `?${qs}` : ""}`);
}

export function getExercise(id) {
  return request(`/api/exercises/${encodeURIComponent(id)}`);
}

export type LastFlightRecord = {
  endedAt: number;
  durationSeconds: number;
};

const LAST_FLIGHT_KEY = "quadtroller.last-flight.v1";

export function readLastFlight(): LastFlightRecord | null {
  try {
    const raw = window.localStorage.getItem(LAST_FLIGHT_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.endedAt !== "number" || typeof record.durationSeconds !== "number") return null;
    return { endedAt: record.endedAt, durationSeconds: Math.max(0, record.durationSeconds) };
  } catch {
    return null;
  }
}

export function saveLastFlight(startedAt: number, endedAt = Date.now()) {
  const record: LastFlightRecord = {
    endedAt,
    durationSeconds: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
  };
  try { window.localStorage.setItem(LAST_FLIGHT_KEY, JSON.stringify(record)); } catch { /* Local history is optional. */ }
  return record;
}

export function formatFlightDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${seconds}s`;
}

export function formatFlightDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

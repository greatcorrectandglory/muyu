const PENDING_DELTA_KEY = "muyu_pending_delta_v1";

export function loadPendingDelta() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(PENDING_DELTA_KEY);
    const parsed = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function savePendingDelta(value) {
  if (typeof window === "undefined") return;

  const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  try {
    window.localStorage.setItem(PENDING_DELTA_KEY, String(safe));
  } catch {
    // Ignore localStorage write failures (private mode/quota/etc.).
  }
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

type Entry = {
  count: number;
  expiresAt: number;
};

const rateLimitState = new Map<string, Entry>();

export function checkObservationRateLimit(observerKey: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitState.get(observerKey);

  if (!entry || entry.expiresAt <= now) {
    rateLimitState.set(observerKey, {
      count: 1,
      expiresAt: now + WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterMs: entry.expiresAt - now,
    };
  }

  entry.count += 1;
  return { allowed: true };
}

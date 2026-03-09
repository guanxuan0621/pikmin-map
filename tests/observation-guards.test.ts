import test from "node:test";
import assert from "node:assert/strict";

import { checkObservationRateLimit } from "../src/lib/mushrooms/rate-limit";
import { getObservationTrustFlags, observationSchema } from "../src/lib/mushrooms/validation";

test("observationSchema rejects missing required fields", () => {
  const parsed = observationSchema.safeParse({
    observedAt: "2026-03-09T06:10:00.000Z",
    isAvailable: true,
    location: {
      latitude: 25,
      longitude: 121.5,
    },
  });

  assert.equal(parsed.success, false);
});

test("checkObservationRateLimit blocks submissions after the configured window threshold", () => {
  let finalResult = { allowed: true } as { allowed: boolean; retryAfterMs?: number };

  for (let index = 0; index < 11; index += 1) {
    finalResult = checkObservationRateLimit("rate-limit-user");
  }

  assert.equal(finalResult.allowed, false);
  assert.ok((finalResult.retryAfterMs ?? 0) > 0);
});

test("getObservationTrustFlags marks future timestamps and defeated observations without defeatedAt", () => {
  const flags = getObservationTrustFlags({
    observerKey: "observer",
    observedAt: "2099-03-09T06:10:00.000Z",
    isAvailable: false,
    location: {
      latitude: 25,
      longitude: 121.5,
    },
  });

  assert.deepEqual(flags.sort(), ["future-timestamp", "missing-defeated-at"]);
});

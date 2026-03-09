import test from "node:test";
import assert from "node:assert/strict";

import { deriveStateFromObservations, predictFromDerivedState } from "../src/lib/mushrooms/derive";
import type { MushroomLocationRecord, ObservationRecord } from "../src/lib/mushrooms/types";

const location: MushroomLocationRecord = {
  id: "loc-test",
  externalKey: "25.00000:121.50000",
  latitude: 25,
  longitude: 121.5,
};

const activeObservations: ObservationRecord[] = [
  {
    id: "obs-1",
    locationId: "loc-test",
    observerKey: "observer-1",
    observedAt: "2026-03-09T06:10:00.000Z",
    isAvailable: true,
    mushroomType: "Water",
    trustStatus: "ACCEPTED",
    trustFlags: [],
    derivedConflictsWithCurrentState: false,
  },
  {
    id: "obs-2",
    locationId: "loc-test",
    observerKey: "observer-2",
    observedAt: "2026-03-09T06:00:00.000Z",
    isAvailable: true,
    mushroomType: "Water",
    trustStatus: "ACCEPTED",
    trustFlags: [],
    derivedConflictsWithCurrentState: false,
  },
];

test("deriveStateFromObservations returns ACTIVE with freshness metadata", () => {
  const derivedState = deriveStateFromObservations(activeObservations);

  assert.ok(derivedState);
  assert.equal(derivedState.currentStatus, "ACTIVE");
  assert.equal(derivedState.sourceObservationCount, 2);
  assert.match(derivedState.lastObservedAt, /2026-03-09T06:10:00.000Z/);
  assert.ok(derivedState.staleAt);
});

test("predictFromDerivedState returns completion and next spawn when enough data exists", () => {
  const prediction = predictFromDerivedState(location, activeObservations);

  assert.equal(prediction.status, "AVAILABLE");
  assert.ok(prediction.predictedCompletionTime);
  assert.ok(prediction.predictedNextSpawnTime);
  assert.ok(prediction.confidence > 0);
  assert.equal(prediction.provenance, "rule-based-v1");
});

test("predictFromDerivedState returns unavailable when there is insufficient data", () => {
  const prediction = predictFromDerivedState(location, activeObservations.slice(0, 1));

  assert.equal(prediction.status, "UNAVAILABLE");
  assert.equal(prediction.confidence, 0);
});

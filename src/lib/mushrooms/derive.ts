import { createUnavailablePrediction } from "@/lib/mushrooms/fixtures";
import type {
  DerivedStateRecord,
  MushroomLocationRecord,
  ObservationRecord,
  PredictionRecord,
} from "@/lib/mushrooms/types";

function getRelevantObservations(observations: ObservationRecord[]): ObservationRecord[] {
  return observations
    .filter((observation) => observation.trustStatus !== "FLAGGED")
    .sort(
      (left, right) =>
        new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime(),
    );
}

export function deriveStateFromObservations(
  observations: ObservationRecord[],
): DerivedStateRecord | undefined {
  const relevant = getRelevantObservations(observations);

  if (relevant.length === 0) {
    return undefined;
  }

  const latest = relevant[0];
  const conflictingCount = observations.filter(
    (observation) => observation.derivedConflictsWithCurrentState,
  ).length;
  const confidence = Math.max(20, Math.min(95, 55 + relevant.length * 8 - conflictingCount * 10));

  return {
    currentStatus: latest.isAvailable ? "ACTIVE" : "DEFEATED",
    confidence,
    sourceObservationCount: relevant.length,
    lastObservedAt: latest.observedAt,
    staleAt: new Date(new Date(latest.observedAt).getTime() + 60 * 60 * 1000).toISOString(),
  };
}

export function predictFromDerivedState(
  location: MushroomLocationRecord,
  observations: ObservationRecord[],
): PredictionRecord {
  const derivedState = deriveStateFromObservations(observations) ?? location.derivedState;
  const relevant = getRelevantObservations(observations);

  if (!derivedState || relevant.length < 2) {
    return createUnavailablePrediction();
  }

  const lastObservedAt = new Date(derivedState.lastObservedAt).getTime();
  const baseConfidence = Math.max(30, Math.min(85, 45 + relevant.length * 7));

  if (derivedState.currentStatus === "ACTIVE") {
    return {
      status: "AVAILABLE",
      predictedCompletionTime: new Date(lastObservedAt + 75 * 60 * 1000).toISOString(),
      predictedNextSpawnTime: new Date(lastObservedAt + 5 * 60 * 60 * 1000).toISOString(),
      confidence: baseConfidence,
      provenance: "rule-based-v1",
      lastComputedAt: new Date().toISOString(),
    };
  }

  return {
    status: "AVAILABLE",
    predictedNextSpawnTime: new Date(lastObservedAt + 3 * 60 * 60 * 1000).toISOString(),
    confidence: baseConfidence - 5,
    provenance: "rule-based-v1",
    lastComputedAt: new Date().toISOString(),
  };
}

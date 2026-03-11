import type {
  MushroomLocationRecord,
  ObservationRecord,
  PredictionRecord,
} from "@/lib/mushrooms/types";

const now = Date.now();

export const fixtureLocations: MushroomLocationRecord[] = [
  {
    id: "loc-taipei-101",
    externalKey: "25.03361:121.56456",
    title: "Taipei 101",
    latitude: 25.03361,
    longitude: 121.56456,
    derivedState: {
      currentStatus: "ACTIVE",
      confidence: 82,
      sourceObservationCount: 4,
      lastObservedAt: new Date(now - 1000 * 60 * 8).toISOString(),
      staleAt: new Date(now + 1000 * 60 * 45).toISOString(),
    },
    prediction: {
      status: "AVAILABLE",
      predictedCompletionTime: new Date(now + 1000 * 60 * 52).toISOString(),
      predictedNextSpawnTime: new Date(now + 1000 * 60 * 60 * 5).toISOString(),
      confidence: 66,
      provenance: "fixture-rule-based",
      lastComputedAt: new Date(now - 1000 * 60 * 2).toISOString(),
    },
  },
  {
    id: "loc-da-an-park",
    externalKey: "25.03291:121.53431",
    title: "Da'an Forest Park",
    latitude: 25.03291,
    longitude: 121.53431,
    derivedState: {
      currentStatus: "DEFEATED",
      confidence: 74,
      sourceObservationCount: 3,
      lastObservedAt: new Date(now - 1000 * 60 * 17).toISOString(),
    },
    prediction: {
      status: "AVAILABLE",
      predictedNextSpawnTime: new Date(now + 1000 * 60 * 60 * 2).toISOString(),
      confidence: 58,
      provenance: "fixture-rule-based",
      lastComputedAt: new Date(now - 1000 * 60 * 2).toISOString(),
    },
  },
  {
    id: "loc-fake-near-you",
    externalKey: "35.57798:139.63432",
    title: "Fake Mushroom Near You",
    latitude: 35.57798,
    longitude: 139.63432,
    sourceLayer: "confirmed",
    derivedState: {
      currentStatus: "ACTIVE",
      confidence: 63,
      sourceObservationCount: 1,
      lastObservedAt: new Date(now - 1000 * 60 * 3).toISOString(),
      staleAt: new Date(now + 1000 * 60 * 57).toISOString(),
    },
    prediction: {
      status: "UNAVAILABLE",
      confidence: 0,
      provenance: "demo-fixture",
      lastComputedAt: new Date(now - 1000 * 60 * 3).toISOString(),
    },
  },
];

export const fixtureObservations: ObservationRecord[] = [
  {
    id: "obs-1",
    locationId: "loc-taipei-101",
    observerKey: "demo-observer",
    observedAt: new Date(now - 1000 * 60 * 8).toISOString(),
    isAvailable: true,
    mushroomType: "Fire",
    trustStatus: "ACCEPTED",
    trustFlags: [],
    derivedConflictsWithCurrentState: false,
  },
];

export function createUnavailablePrediction(): PredictionRecord {
  return {
    status: "UNAVAILABLE",
    confidence: 0,
    provenance: "insufficient-data",
    lastComputedAt: new Date().toISOString(),
  };
}

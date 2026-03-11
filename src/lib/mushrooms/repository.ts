import { randomUUID } from "node:crypto";

import { createUnavailablePrediction, fixtureLocations, fixtureObservations } from "@/lib/mushrooms/fixtures";
import { createLocationExternalKey, getDistanceMeters, isPointInViewport } from "@/lib/mushrooms/geo";
import {
  fetchOverpassMushroomCandidates,
  fetchOverpassNearbyMushroomCandidates,
  mergeOverpassCandidateLocations,
  type OverpassNearbyQuery,
} from "@/lib/mushrooms/overpass";
import type {
  MapViewport,
  MushroomLocationRecord,
  ObservationRecord,
  SubmitObservationInput,
} from "@/lib/mushrooms/types";
import { getObservationTrustFlags } from "@/lib/mushrooms/validation";

const useFixtureStore = !process.env.DATABASE_URL;

async function getPrismaClient() {
  const { getPrismaClient: createClient } = await import("@/lib/prisma");
  return createClient();
}

function mapPrismaLocation(record: {
  id: string;
  externalKey: string;
  title: string | null;
  latitude: number;
  longitude: number;
  derivedState: {
    currentStatus: "ACTIVE" | "DEFEATED" | "UNKNOWN";
    confidence: number;
    sourceObservationCount: number;
    lastObservedAt: Date;
    staleAt: Date | null;
  } | null;
  prediction: {
    status: "AVAILABLE" | "UNAVAILABLE";
    predictedCompletionTime: Date | null;
    predictedNextSpawnTime: Date | null;
    confidence: number;
    provenance: string;
    lastComputedAt: Date;
  } | null;
}): MushroomLocationRecord {
  return {
    id: record.id,
    externalKey: record.externalKey,
    title: record.title ?? undefined,
    latitude: record.latitude,
    longitude: record.longitude,
    sourceLayer: "confirmed",
    derivedState: record.derivedState
      ? {
          ...record.derivedState,
          lastObservedAt: record.derivedState.lastObservedAt.toISOString(),
          staleAt: record.derivedState.staleAt?.toISOString(),
        }
      : undefined,
    prediction: record.prediction
      ? {
          status: record.prediction.status,
          predictedCompletionTime: record.prediction.predictedCompletionTime?.toISOString(),
          predictedNextSpawnTime: record.prediction.predictedNextSpawnTime?.toISOString(),
          confidence: record.prediction.confidence,
          provenance: record.prediction.provenance,
          lastComputedAt: record.prediction.lastComputedAt.toISOString(),
        }
      : undefined,
  };
}

function hasConflictingObservation(locationId: string, input: SubmitObservationInput): boolean {
  const observedAtMs = new Date(input.observedAt).getTime();

  return fixtureObservations.some((existing) => {
    if (existing.locationId !== locationId) {
      return false;
    }

    const diffMs = Math.abs(new Date(existing.observedAt).getTime() - observedAtMs);
    const closeInTime = diffMs <= 15 * 60 * 1000;
    const availabilityConflict = existing.isAvailable !== input.isAvailable;
    const typeConflict =
      Boolean(existing.mushroomType) &&
      Boolean(input.mushroomType) &&
      existing.mushroomType !== input.mushroomType;

    return closeInTime && (availabilityConflict || typeConflict);
  });
}

function mergeConfirmedAndCandidates(
  confirmedLocations: MushroomLocationRecord[],
  candidateLocations: MushroomLocationRecord[],
): MushroomLocationRecord[] {
  const filteredCandidates = candidateLocations.filter((candidate) => {
    return !confirmedLocations.some((confirmed) => {
      if (confirmed.externalKey === candidate.externalKey) {
        return true;
      }

      return getDistanceMeters(confirmed, candidate) <= 60;
    });
  });

  return [...confirmedLocations, ...filteredCandidates];
}

async function fetchCandidateLocations(
  viewport: MapViewport,
  nearby?: OverpassNearbyQuery,
): Promise<MushroomLocationRecord[]> {
  const [viewportCandidates, nearbyCandidates] = await Promise.all([
    fetchOverpassMushroomCandidates(viewport),
    nearby ? fetchOverpassNearbyMushroomCandidates(nearby) : Promise.resolve([]),
  ]);

  return mergeOverpassCandidateLocations(viewportCandidates, nearbyCandidates).filter((location) =>
    isPointInViewport(location, viewport),
  );
}

export async function getMushroomsInViewport(
  viewport: MapViewport,
  options?: {
    nearby?: OverpassNearbyQuery;
  },
): Promise<MushroomLocationRecord[]> {
  let candidateLocations: MushroomLocationRecord[] = [];

  if (useFixtureStore) {
    const localLocations = fixtureLocations
      .filter((location) => isPointInViewport(location, viewport))
      .map((location) => ({
        ...location,
        sourceLayer: "confirmed" as const,
        prediction: location.prediction ?? createUnavailablePrediction(),
      }));

    try {
      candidateLocations = await fetchCandidateLocations(viewport, options?.nearby);
    } catch (error) {
      console.warn(
        error instanceof Error
          ? `Overpass fallback failed: ${error.message}`
          : "Overpass fallback failed.",
      );
    }

    return mergeConfirmedAndCandidates(
      localLocations,
      candidateLocations.map((location) => ({
        ...location,
        sourceLayer: "candidate",
        prediction: location.prediction ?? createUnavailablePrediction(),
      })),
    );
  }

  const prisma = await getPrismaClient();
  const locations = await prisma.mushroomLocation.findMany({
    where: {
      latitude: {
        gte: viewport.minLat,
        lte: viewport.maxLat,
      },
      longitude: {
        gte: viewport.minLng,
        lte: viewport.maxLng,
      },
    },
    include: {
      derivedState: true,
      prediction: true,
    },
    orderBy: [{ latitude: "asc" }, { longitude: "asc" }],
  });

  const confirmedLocations = locations.map(mapPrismaLocation);

  try {
    candidateLocations = await fetchCandidateLocations(viewport, options?.nearby);
  } catch (error) {
    console.warn(
      error instanceof Error ? `Overpass candidate fetch failed: ${error.message}` : "Overpass candidate fetch failed.",
    );
  }

  return mergeConfirmedAndCandidates(confirmedLocations, candidateLocations);
}

export async function submitObservation(input: SubmitObservationInput): Promise<{
  observation: ObservationRecord;
  location: MushroomLocationRecord;
}> {
  const externalKey = createLocationExternalKey(input.location.latitude, input.location.longitude);
  const trustFlags = getObservationTrustFlags(input);

  if (useFixtureStore) {
    let location = fixtureLocations.find((item) => item.externalKey === externalKey);

    if (!location) {
      location = {
        id: `loc-${randomUUID()}`,
        externalKey,
        title: input.location.title,
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        sourceLayer: "confirmed",
        prediction: createUnavailablePrediction(),
      };
      fixtureLocations.push(location);
    }

    const observation: ObservationRecord = {
      id: `obs-${randomUUID()}`,
      locationId: location.id,
      observerKey: input.observerKey,
      observedAt: input.observedAt,
      isAvailable: input.isAvailable,
      mushroomType: input.mushroomType,
      defeatedAt: input.defeatedAt,
      trustStatus: trustFlags.length > 0 ? "FLAGGED" : "ACCEPTED",
      trustFlags,
      derivedConflictsWithCurrentState: hasConflictingObservation(location.id, input),
    };

    fixtureObservations.unshift(observation);

    return { observation, location };
  }

  const prisma = await getPrismaClient();
  const location = await prisma.mushroomLocation.upsert({
    where: { externalKey },
    update: {
      title: input.location.title ?? null,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
    },
    create: {
      externalKey,
      title: input.location.title ?? null,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
    },
    include: {
      derivedState: true,
      prediction: true,
    },
  });

  const observation = await prisma.observation.create({
    data: {
      locationId: location.id,
      observerKey: input.observerKey,
      observedAt: new Date(input.observedAt),
      isAvailable: input.isAvailable,
      mushroomType: input.mushroomType,
      defeatedAt: input.defeatedAt ? new Date(input.defeatedAt) : null,
      trustStatus: trustFlags.length > 0 ? "FLAGGED" : "ACCEPTED",
      trustFlags,
      derivedConflictsWithCurrentState: false,
      rawPayload: input,
    },
  });

  return {
    observation: {
      id: observation.id,
      locationId: observation.locationId,
      observerKey: observation.observerKey,
      observedAt: observation.observedAt.toISOString(),
      isAvailable: observation.isAvailable,
      mushroomType: observation.mushroomType ?? undefined,
      defeatedAt: observation.defeatedAt?.toISOString(),
      trustStatus: observation.trustStatus,
      trustFlags: observation.trustFlags,
      derivedConflictsWithCurrentState: observation.derivedConflictsWithCurrentState,
    },
    location: mapPrismaLocation(location),
  };
}

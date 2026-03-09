import { getPrismaClient } from "@/lib/prisma";
import { fixtureLocations, fixtureObservations } from "@/lib/mushrooms/fixtures";
import { deriveStateFromObservations, predictFromDerivedState } from "@/lib/mushrooms/derive";
import type { MushroomLocationRecord, ObservationRecord } from "@/lib/mushrooms/types";

const useFixtureStore = !process.env.DATABASE_URL;
const pendingFixtureLocationIds = new Set<string>();

function getFixtureLocation(locationId: string): MushroomLocationRecord | undefined {
  return fixtureLocations.find((location) => location.id === locationId);
}

function getFixtureObservations(locationId: string): ObservationRecord[] {
  return fixtureObservations.filter((observation) => observation.locationId === locationId);
}

export function queueLocationRefresh(locationId: string): void {
  if (useFixtureStore) {
    pendingFixtureLocationIds.add(locationId);
  }
}

export async function enqueueLocationRefresh(locationId: string): Promise<void> {
  if (useFixtureStore) {
    queueLocationRefresh(locationId);
    return;
  }

  const prisma = getPrismaClient();
  await prisma.refreshJob.create({
    data: {
      locationId,
    },
  });
}

async function refreshFixtureLocation(locationId: string) {
  const location = getFixtureLocation(locationId);

  if (!location) {
    return;
  }

  const observations = getFixtureObservations(locationId);
  const derivedState = deriveStateFromObservations(observations);
  const prediction = predictFromDerivedState(location, observations);

  location.derivedState = derivedState;
  location.prediction = prediction;
}

async function processFixtureQueue(maxJobs: number): Promise<number> {
  const locationIds = Array.from(pendingFixtureLocationIds).slice(0, maxJobs);

  for (const locationId of locationIds) {
    await refreshFixtureLocation(locationId);
    pendingFixtureLocationIds.delete(locationId);
  }

  return locationIds.length;
}

async function processDatabaseQueue(maxJobs: number): Promise<number> {
  const prisma = getPrismaClient();
  const jobs = await prisma.refreshJob.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    take: maxJobs,
  });

  for (const job of jobs) {
    await prisma.refreshJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
      },
    });

    try {
      const location = await prisma.mushroomLocation.findUnique({
        where: { id: job.locationId },
        include: {
          derivedState: true,
          prediction: true,
          observations: {
            orderBy: {
              observedAt: "desc",
            },
          },
        },
      });

      if (!location) {
        throw new Error(`Location ${job.locationId} not found.`);
      }

      const observations: ObservationRecord[] = location.observations.map((observation) => ({
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
      }));

      const locationRecord: MushroomLocationRecord = {
        id: location.id,
        externalKey: location.externalKey,
        title: location.title ?? undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        derivedState: location.derivedState
          ? {
              currentStatus: location.derivedState.currentStatus,
              confidence: location.derivedState.confidence,
              sourceObservationCount: location.derivedState.sourceObservationCount,
              lastObservedAt: location.derivedState.lastObservedAt.toISOString(),
              staleAt: location.derivedState.staleAt?.toISOString(),
            }
          : undefined,
        prediction: location.prediction
          ? {
              status: location.prediction.status,
              predictedCompletionTime: location.prediction.predictedCompletionTime?.toISOString(),
              predictedNextSpawnTime: location.prediction.predictedNextSpawnTime?.toISOString(),
              confidence: location.prediction.confidence,
              provenance: location.prediction.provenance,
              lastComputedAt: location.prediction.lastComputedAt.toISOString(),
            }
          : undefined,
      };

      const derivedState = deriveStateFromObservations(observations);
      const prediction = predictFromDerivedState(locationRecord, observations);

      if (derivedState) {
        await prisma.derivedMushroomState.upsert({
          where: { locationId: location.id },
          update: {
            currentStatus: derivedState.currentStatus,
            confidence: derivedState.confidence,
            sourceObservationCount: derivedState.sourceObservationCount,
            lastObservedAt: new Date(derivedState.lastObservedAt),
            staleAt: derivedState.staleAt ? new Date(derivedState.staleAt) : null,
          },
          create: {
            locationId: location.id,
            currentStatus: derivedState.currentStatus,
            confidence: derivedState.confidence,
            sourceObservationCount: derivedState.sourceObservationCount,
            lastObservedAt: new Date(derivedState.lastObservedAt),
            staleAt: derivedState.staleAt ? new Date(derivedState.staleAt) : null,
          },
        });
      }

      await prisma.prediction.upsert({
        where: { locationId: location.id },
        update: {
          status: prediction.status,
          predictedCompletionTime: prediction.predictedCompletionTime
            ? new Date(prediction.predictedCompletionTime)
            : null,
          predictedNextSpawnTime: prediction.predictedNextSpawnTime
            ? new Date(prediction.predictedNextSpawnTime)
            : null,
          confidence: prediction.confidence,
          provenance: prediction.provenance,
          lastComputedAt: new Date(prediction.lastComputedAt),
        },
        create: {
          locationId: location.id,
          status: prediction.status,
          predictedCompletionTime: prediction.predictedCompletionTime
            ? new Date(prediction.predictedCompletionTime)
            : null,
          predictedNextSpawnTime: prediction.predictedNextSpawnTime
            ? new Date(prediction.predictedNextSpawnTime)
            : null,
          confidence: prediction.confidence,
          provenance: prediction.provenance,
          lastComputedAt: new Date(prediction.lastComputedAt),
        },
      });

      await prisma.refreshJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETE",
          finishedAt: new Date(),
          error: null,
        },
      });
    } catch (error) {
      await prisma.refreshJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : "Unknown refresh error.",
        },
      });
    }
  }

  return jobs.length;
}

export async function processRefreshQueue(maxJobs = 25): Promise<number> {
  if (useFixtureStore) {
    return processFixtureQueue(maxJobs);
  }

  return processDatabaseQueue(maxJobs);
}

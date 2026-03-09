import { createLocationExternalKey, getDistanceMeters } from "@/lib/mushrooms/geo";
import type { MapViewport, MushroomLocationRecord } from "@/lib/mushrooms/types";

export type OverpassNearbyQuery = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type OverpassLocationCandidate = MushroomLocationRecord & {
  dedupeKey: string;
  sourceType: OverpassElement["type"];
};

const DEFAULT_OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_OVERPASS_TIMEOUT_MS = 7_000;
const OVERPASS_CACHE_TTL_MS = 10 * 60 * 1000;

const overpassCache = new Map<
  string,
  {
    expiresAt: number;
    locations: MushroomLocationRecord[];
  }
>();

function getOverpassApiUrl(): string {
  return process.env.OVERPASS_API_URL || DEFAULT_OVERPASS_API_URL;
}

function getOverpassTimeoutMs(): number {
  const raw = Number(process.env.OVERPASS_TIMEOUT_MS ?? DEFAULT_OVERPASS_TIMEOUT_MS);

  if (Number.isNaN(raw) || raw <= 0) {
    return DEFAULT_OVERPASS_TIMEOUT_MS;
  }

  return raw;
}

function roundCacheValue(value: number): string {
  return value.toFixed(3);
}

function getViewportCacheKey(viewport: MapViewport): string {
  return [
    "viewport",
    roundCacheValue(viewport.minLat),
    roundCacheValue(viewport.minLng),
    roundCacheValue(viewport.maxLat),
    roundCacheValue(viewport.maxLng),
  ].join(":");
}

function getNearbyCacheKey(nearby: OverpassNearbyQuery): string {
  return [
    "nearby",
    roundCacheValue(nearby.latitude),
    roundCacheValue(nearby.longitude),
    Math.round(nearby.radiusMeters / 100) * 100,
  ].join(":");
}

function getElementCoordinates(element: OverpassElement): { latitude: number; longitude: number } | null {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return {
      latitude: element.center.lat,
      longitude: element.center.lon,
    };
  }

  return null;
}

function getElementLabel(tags: Record<string, string>): string {
  return (
    tags.name ??
    tags["name:en"] ??
    tags.brand ??
    tags.operator ??
    tags.amenity ??
    tags.shop ??
    tags.tourism ??
    tags.leisure ??
    tags.railway ??
    "Unnamed POI"
  );
}

function getElementCategory(tags: Record<string, string>): string {
  return tags.amenity ?? tags.shop ?? tags.tourism ?? tags.leisure ?? tags.railway ?? "unknown";
}

function mapOverpassElementToLocation(element: OverpassElement): OverpassLocationCandidate | null {
  const coordinates = getElementCoordinates(element);

  if (!coordinates) {
    return null;
  }

  const tags = element.tags ?? {};
  const rawLabel = getElementLabel(tags);
  const title = `${rawLabel} (OSM POI)`;
  const category = getElementCategory(tags);

  return {
    id: `overpass-${element.type}-${element.id}`,
    externalKey: createLocationExternalKey(coordinates.latitude, coordinates.longitude),
    title,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    sourceLayer: "candidate",
    dedupeKey: `${rawLabel.toLowerCase()}::${category}`,
    sourceType: element.type,
  };
}

export function buildOverpassQuery(viewport: MapViewport): string {
  const box = `${viewport.minLat},${viewport.minLng},${viewport.maxLat},${viewport.maxLng}`;

  return `
[out:json][timeout:25];
(
  node(${box})[amenity~"^(cafe|restaurant|fast_food|pharmacy|post_office)$"];
  node(${box})[shop~"^(convenience|supermarket|bakery|hairdresser)$"];
  node(${box})[tourism~"^(hotel|theme_park|zoo)$"];
  node(${box})[leisure="park"];
  node(${box})[railway="station"];
  way(${box})[amenity~"^(cafe|restaurant|fast_food|pharmacy|post_office)$"];
  way(${box})[shop~"^(convenience|supermarket|bakery|hairdresser)$"];
  way(${box})[tourism~"^(hotel|theme_park|zoo)$"];
  way(${box})[leisure="park"];
  way(${box})[railway="station"];
);
out center 40;
`.trim();
}

export function buildOverpassNearbyQuery(nearby: OverpassNearbyQuery): string {
  const around = `${Math.round(nearby.radiusMeters)},${nearby.latitude},${nearby.longitude}`;

  return `
[out:json][timeout:25];
(
  node(around:${around})[amenity~"^(cafe|restaurant|fast_food|pharmacy|post_office)$"];
  node(around:${around})[shop~"^(convenience|supermarket|bakery|hairdresser)$"];
  node(around:${around})[tourism~"^(hotel|theme_park|zoo)$"];
  node(around:${around})[leisure="park"];
  node(around:${around})[railway="station"];
  way(around:${around})[amenity~"^(cafe|restaurant|fast_food|pharmacy|post_office)$"];
  way(around:${around})[shop~"^(convenience|supermarket|bakery|hairdresser)$"];
  way(around:${around})[tourism~"^(hotel|theme_park|zoo)$"];
  way(around:${around})[leisure="park"];
  way(around:${around})[railway="station"];
);
out center 60;
`.trim();
}

export function mapOverpassResponseToLocations(payload: OverpassResponse): MushroomLocationRecord[] {
  const dedupedByCoordinate = new Map<string, OverpassLocationCandidate>();
  const mergedCandidates: OverpassLocationCandidate[] = [];

  for (const element of payload.elements ?? []) {
    const location = mapOverpassElementToLocation(element);

    if (!location) {
      continue;
    }

    dedupedByCoordinate.set(location.externalKey, location);
  }

  for (const candidate of dedupedByCoordinate.values()) {
    const existingIndex = mergedCandidates.findIndex((existing) => {
      if (existing.dedupeKey !== candidate.dedupeKey) {
        return false;
      }

      return (
        getDistanceMeters(existing, candidate) <= 60
      );
    });

    if (existingIndex === -1) {
      mergedCandidates.push(candidate);
      continue;
    }

    const existing = mergedCandidates[existingIndex];

    if (existing && existing.sourceType !== "node" && candidate.sourceType === "node") {
      mergedCandidates[existingIndex] = candidate;
    }
  }

  return mergedCandidates.map(({ dedupeKey: _dedupeKey, sourceType: _sourceType, ...location }) => location).sort((left, right) =>
    left.title?.localeCompare(right.title ?? "", "ja") ?? 0,
  );
}

async function performOverpassQuery(
  cacheKey: string,
  query: string,
): Promise<MushroomLocationRecord[]> {
  const cached = overpassCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.locations;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getOverpassTimeoutMs());

  try {
    const response = await fetch(getOverpassApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({
        data: query,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as OverpassResponse;
    const locations = mapOverpassResponseToLocations(payload);

    overpassCache.set(cacheKey, {
      expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
      locations,
    });

    return locations;
  } catch (error) {
    if (cached?.locations.length) {
      return cached.locations;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchOverpassMushroomCandidates(
  viewport: MapViewport,
): Promise<MushroomLocationRecord[]> {
  return performOverpassQuery(getViewportCacheKey(viewport), buildOverpassQuery(viewport));
}

export async function fetchOverpassNearbyMushroomCandidates(
  nearby: OverpassNearbyQuery,
): Promise<MushroomLocationRecord[]> {
  return performOverpassQuery(getNearbyCacheKey(nearby), buildOverpassNearbyQuery(nearby));
}

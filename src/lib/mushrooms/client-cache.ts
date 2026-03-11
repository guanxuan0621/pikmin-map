import { isPointInViewport } from "@/lib/mushrooms/geo";
import type { MapViewport, MushroomLocationRecord } from "@/lib/mushrooms/types";

type CachedMushroomsPayload = {
  mushrooms: MushroomLocationRecord[];
  nearbyMushrooms?: MushroomLocationRecord[];
};

type MushroomApiCacheEntry = {
  savedAt: number;
  payload: CachedMushroomsPayload;
};

const MUSHROOM_API_CACHE_STORAGE_KEY = "pikmin-map:mushrooms-api-cache:v2";
const MUSHROOM_API_CACHE_TTL_MS = 10 * 60 * 1000;
const MUSHROOM_API_CACHE_MAX_ENTRIES = 15;

const memoryCache = new Map<string, MushroomApiCacheEntry>();
const inFlightRequests = new Map<string, Promise<CachedMushroomsPayload>>();

function normalizeCoordinate(rawValue: string | null): string {
  const value = Number(rawValue ?? 0);
  return value.toFixed(3);
}

function normalizeRadius(rawValue: string | null): string {
  const value = Number(rawValue ?? 0);
  const rounded = Math.round(value / 100) * 100;
  return String(Math.max(rounded, 0));
}

function isEntryFresh(entry: MushroomApiCacheEntry, now = Date.now()): boolean {
  return now - entry.savedAt < MUSHROOM_API_CACHE_TTL_MS;
}

function pruneEntries(
  entries: Record<string, MushroomApiCacheEntry>,
  now = Date.now(),
): Record<string, MushroomApiCacheEntry> {
  const sortedEntries = Object.entries(entries)
    .filter(([, entry]) => isEntryFresh(entry, now))
    .sort((left, right) => right[1].savedAt - left[1].savedAt)
    .slice(0, MUSHROOM_API_CACHE_MAX_ENTRIES);

  return Object.fromEntries(sortedEntries);
}

function readPersistedEntries(): Record<string, MushroomApiCacheEntry> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(MUSHROOM_API_CACHE_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, MushroomApiCacheEntry>;
    return pruneEntries(parsed);
  } catch {
    return {};
  }
}

function writePersistedEntries(entries: Record<string, MushroomApiCacheEntry>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MUSHROOM_API_CACHE_STORAGE_KEY, JSON.stringify(pruneEntries(entries)));
  } catch {
    // Ignore storage quota or parsing issues and keep using in-memory cache.
  }
}

function isNearbyCacheKey(cacheKey: string): boolean {
  return cacheKey.startsWith("nearby:");
}

function isDegradedEmptyNearbyPayload(payload: CachedMushroomsPayload): boolean {
  return payload.mushrooms.length === 0 && (payload.nearbyMushrooms?.length ?? 0) === 0;
}

export function buildMushroomApiCacheKey(query: URLSearchParams): string {
  if (query.has("centerLat") && query.has("centerLng")) {
    return [
      "nearby",
      normalizeCoordinate(query.get("centerLat")),
      normalizeCoordinate(query.get("centerLng")),
      "radius",
      normalizeRadius(query.get("radiusMeters")),
    ].join(":");
  }

  return [
    "viewport",
    normalizeCoordinate(query.get("minLat")),
    normalizeCoordinate(query.get("maxLat")),
    normalizeCoordinate(query.get("minLng")),
    normalizeCoordinate(query.get("maxLng")),
  ].join(":");
}

export function getCachedMushroomsPayload(cacheKey: string): CachedMushroomsPayload | null {
  const inMemoryEntry = memoryCache.get(cacheKey);

  if (inMemoryEntry && isEntryFresh(inMemoryEntry)) {
    if (isNearbyCacheKey(cacheKey) && isDegradedEmptyNearbyPayload(inMemoryEntry.payload)) {
      memoryCache.delete(cacheKey);
      return null;
    }

    return inMemoryEntry.payload;
  }

  if (inMemoryEntry) {
    memoryCache.delete(cacheKey);
  }

  const persistedEntries = readPersistedEntries();
  const persistedEntry = persistedEntries[cacheKey];

  if (!persistedEntry) {
    return null;
  }

  if (!isEntryFresh(persistedEntry)) {
    delete persistedEntries[cacheKey];
    writePersistedEntries(persistedEntries);
    return null;
  }

  if (isNearbyCacheKey(cacheKey) && isDegradedEmptyNearbyPayload(persistedEntry.payload)) {
    delete persistedEntries[cacheKey];
    writePersistedEntries(persistedEntries);
    return null;
  }

  memoryCache.set(cacheKey, persistedEntry);
  return persistedEntry.payload;
}

export function setCachedMushroomsPayload(cacheKey: string, payload: CachedMushroomsPayload) {
  if (isNearbyCacheKey(cacheKey) && isDegradedEmptyNearbyPayload(payload)) {
    memoryCache.delete(cacheKey);
    const persistedEntries = readPersistedEntries();
    delete persistedEntries[cacheKey];
    writePersistedEntries(persistedEntries);
    return;
  }

  const entry: MushroomApiCacheEntry = {
    savedAt: Date.now(),
    payload,
  };

  memoryCache.set(cacheKey, entry);

  const persistedEntries = readPersistedEntries();
  persistedEntries[cacheKey] = entry;
  writePersistedEntries(persistedEntries);
}

export function getOrCreateMushroomApiRequest(
  cacheKey: string,
  loader: () => Promise<CachedMushroomsPayload>,
): Promise<CachedMushroomsPayload> {
  const existingRequest = inFlightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const nextRequest = loader().finally(() => {
    if (inFlightRequests.get(cacheKey) === nextRequest) {
      inFlightRequests.delete(cacheKey);
    }
  });

  inFlightRequests.set(cacheKey, nextRequest);
  return nextRequest;
}

export function pruneMushroomApiCacheEntriesForTest(
  entries: Record<string, MushroomApiCacheEntry>,
  now: number,
): Record<string, MushroomApiCacheEntry> {
  return pruneEntries(entries, now);
}

export function getVisibleMushroomsFromCachedPayload(
  payload: CachedMushroomsPayload,
  viewport: MapViewport,
): MushroomLocationRecord[] {
  if (!payload.nearbyMushrooms) {
    return payload.mushrooms;
  }

  return payload.nearbyMushrooms.filter((location) => isPointInViewport(location, viewport));
}

export function shouldSkipNearbyEmptyCachePayloadForTest(
  cacheKey: string,
  payload: CachedMushroomsPayload,
): boolean {
  return isNearbyCacheKey(cacheKey) && isDegradedEmptyNearbyPayload(payload);
}

export function clearMushroomApiRequestDeduperForTest() {
  inFlightRequests.clear();
}

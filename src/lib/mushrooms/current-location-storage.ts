type RememberedCurrentLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  savedAt: number;
};

const REMEMBERED_CURRENT_LOCATION_STORAGE_KEY = "pikmin-map:last-current-location:v1";
const REMEMBERED_CURRENT_LOCATION_TTL_MS = 24 * 60 * 60 * 1000;

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRememberedCurrentLocation(value: unknown): value is RememberedCurrentLocation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RememberedCurrentLocation>;

  return (
    isFiniteNumber(candidate.latitude) &&
    isFiniteNumber(candidate.longitude) &&
    isFiniteNumber(candidate.savedAt) &&
    (candidate.accuracyMeters === undefined || isFiniteNumber(candidate.accuracyMeters))
  );
}

export function readRememberedCurrentLocation(now = Date.now()): RememberedCurrentLocation | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(REMEMBERED_CURRENT_LOCATION_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!isRememberedCurrentLocation(parsed)) {
      window.localStorage.removeItem(REMEMBERED_CURRENT_LOCATION_STORAGE_KEY);
      return null;
    }

    if (now - parsed.savedAt >= REMEMBERED_CURRENT_LOCATION_TTL_MS) {
      window.localStorage.removeItem(REMEMBERED_CURRENT_LOCATION_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeRememberedCurrentLocation(
  location: Omit<RememberedCurrentLocation, "savedAt">,
  now = Date.now(),
) {
  if (!canUseStorage()) {
    return;
  }

  const payload: RememberedCurrentLocation = {
    ...location,
    savedAt: now,
  };

  try {
    window.localStorage.setItem(REMEMBERED_CURRENT_LOCATION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors and keep location memory in runtime state only.
  }
}

export function clearRememberedCurrentLocation() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(REMEMBERED_CURRENT_LOCATION_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export const rememberedCurrentLocationStorageKeyForTest =
  REMEMBERED_CURRENT_LOCATION_STORAGE_KEY;
export const rememberedCurrentLocationTtlMsForTest = REMEMBERED_CURRENT_LOCATION_TTL_MS;

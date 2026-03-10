import { getDistanceMeters } from "@/lib/mushrooms/geo";
import type { MushroomLocationRecord, MushroomLocationSourceLayer } from "@/lib/mushrooms/types";

export type MushroomMarkerTone = "active" | "defeated" | "unknown";
export type CurrentLocationStatus =
  | "idle"
  | "requesting"
  | "available"
  | "denied"
  | "error"
  | "unsupported";

export const CURRENT_LOCATION_ZOOM = 14;
const RECENTER_EPSILON = 0.00001;
export const MARKER_LEGEND_ITEMS: Array<{
  tone: MushroomMarkerTone | "current-location";
  label: string;
}> = [
  { tone: "current-location", label: "你的位置" },
  { tone: "active", label: "進行中的蘑菇" },
  { tone: "defeated", label: "已結束的蘑菇" },
  { tone: "unknown", label: "狀態未知" },
];

export const MUSHROOM_LAYER_ITEMS: Array<{
  layer: MushroomLocationSourceLayer;
  label: string;
  description: string;
}> = [
  {
    layer: "confirmed",
    label: "已確認蘑菇",
    description: "來自回報或既有資料的實際位置。",
  },
  {
    layer: "candidate",
    label: "潛在候選點",
    description: "來自 OSM/Overpass 的候選 POI，尚未被回報確認。",
  },
];

export function getMushroomMarkerTone(
  status?: MushroomLocationRecord["derivedState"] extends infer T
    ? T extends { currentStatus: infer U }
      ? U
      : never
    : never,
): MushroomMarkerTone {
  if (status === "ACTIVE") {
    return "active";
  }

  if (status === "DEFEATED") {
    return "defeated";
  }

  return "unknown";
}

export function getMushroomMarkerLabel(location: MushroomLocationRecord): string {
  const title = location.title ?? location.externalKey;
  const status = location.derivedState?.currentStatus ?? "UNKNOWN";
  const layerLabel = getMushroomSourceLayerLabel(location.sourceLayer ?? "confirmed");

  return `${title} ${layerLabel} ${status}`;
}

export function getMushroomSourceLayerLabel(layer: MushroomLocationSourceLayer): string {
  return layer === "confirmed" ? "已確認蘑菇" : "潛在候選點";
}

function stripMarkerSourceSuffix(value: string): string {
  return value.replace(/\s*\(OSM POI\)\s*$/u, "").replace(/\s*\([^)]*\)\s*$/u, "").trim();
}

function trimMarkerShortLabel(value: string): string {
  return value.replace(/[-\s・()]+$/u, "").trim();
}

export function getMushroomMarkerShortLabel(location: MushroomLocationRecord): string {
  const rawTitle = stripMarkerSourceSuffix(location.title ?? location.externalKey);
  const compactTitle = rawTitle.replace(/\s+/gu, " ").trim();

  if (!compactTitle) {
    return "POI";
  }

  const asciiWords = compactTitle
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
  const hasOnlyAsciiWords =
    asciiWords.length > 0 && asciiWords.every((token) => /^[A-Za-z0-9]+$/u.test(token));

  if (hasOnlyAsciiWords && asciiWords.length > 1) {
    return trimMarkerShortLabel(
      asciiWords
      .slice(0, 3)
      .map((token) => token[0]?.toUpperCase() ?? "")
      .join(""),
    );
  }

  if (/^[A-Za-z0-9]+$/u.test(compactTitle)) {
    return trimMarkerShortLabel(compactTitle.slice(0, 4).toUpperCase());
  }

  return trimMarkerShortLabel(Array.from(compactTitle).slice(0, 4).join(""));
}

export function buildMushroomMarkerShortLabelMap(
  locations: MushroomLocationRecord[],
): Record<string, string> {
  const groupedLocations = new Map<string, MushroomLocationRecord[]>();

  for (const location of locations) {
    const baseLabel = getMushroomMarkerShortLabel(location);
    const group = groupedLocations.get(baseLabel) ?? [];
    group.push(location);
    groupedLocations.set(baseLabel, group);
  }

  const labelMap: Record<string, string> = {};

  for (const [baseLabel, group] of groupedLocations) {
    if (group.length === 1) {
      const onlyLocation = group[0];

      if (onlyLocation) {
        labelMap[onlyLocation.id] = baseLabel;
      }

      continue;
    }

    const numberedPrefix = Array.from(baseLabel).slice(0, 3).join("") || "POI";
    const sortedGroup = [...group].sort((left, right) =>
      (left.title ?? left.externalKey).localeCompare(right.title ?? right.externalKey, "ja"),
    );

    sortedGroup.forEach((location, index) => {
      labelMap[location.id] = `${numberedPrefix}${index + 1}`;
    });
  }

  return labelMap;
}

function getStableCandidateSemanticKey(location: MushroomLocationRecord): string {
  return [
    location.sourceLayer ?? "confirmed",
    stripMarkerSourceSuffix(location.title ?? location.externalKey).toLowerCase(),
  ].join("::");
}

export function reconcileDisplayMushrooms(
  previousLocations: MushroomLocationRecord[],
  nextLocations: MushroomLocationRecord[],
  maxSnapDistanceMeters = 80,
): MushroomLocationRecord[] {
  if (previousLocations.length === 0 || nextLocations.length === 0) {
    return nextLocations;
  }

  const previousCandidatesByKey = previousLocations.reduce<Map<string, MushroomLocationRecord[]>>(
    (groups, location) => {
      if ((location.sourceLayer ?? "confirmed") !== "candidate") {
        return groups;
      }

      const key = getStableCandidateSemanticKey(location);
      const group = groups.get(key) ?? [];
      group.push(location);
      groups.set(key, group);
      return groups;
    },
    new Map<string, MushroomLocationRecord[]>(),
  );

  return nextLocations.map((location) => {
    if ((location.sourceLayer ?? "confirmed") !== "candidate") {
      return location;
    }

    const candidates = previousCandidatesByKey.get(getStableCandidateSemanticKey(location)) ?? [];
    let closestPrevious: MushroomLocationRecord | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const previousLocation of candidates) {
      const distance = getDistanceMeters(previousLocation, location);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPrevious = previousLocation;
      }
    }

    if (!closestPrevious || closestDistance > maxSnapDistanceMeters) {
      return location;
    }

    return {
      ...location,
      id: closestPrevious.id,
      externalKey: closestPrevious.externalKey,
      latitude: closestPrevious.latitude,
      longitude: closestPrevious.longitude,
    };
  });
}

export function getCurrentLocationActionLabel(status: CurrentLocationStatus): string {
  if (status === "available") {
    return "回到我的位置";
  }

  if (status === "requesting") {
    return "定位中...";
  }

  return "定位我目前位置";
}

export function getCurrentLocationStatusMessage(status: CurrentLocationStatus): string {
  switch (status) {
    case "idle":
      return "目前尚未使用定位，可隨時手動定位。";
    case "requesting":
      return "正在取得你目前的位置...";
    case "available":
      return "已取得目前位置，可快速回到你附近。";
    case "denied":
      return "你已拒絕定位權限，仍可繼續手動瀏覽地圖。";
    case "unsupported":
      return "目前瀏覽器不支援定位功能。";
    case "error":
      return "定位失敗，請稍後再試。";
  }
}

export function shouldShowInitialLocationPrompt(input: {
  currentLocationStatus: CurrentLocationStatus;
  hasHandledPrompt: boolean;
  isMapReady: boolean;
}): boolean {
  return (
    input.isMapReady &&
    !input.hasHandledPrompt &&
    input.currentLocationStatus === "idle"
  );
}

export function getInitialLocationPromptMessage(): string {
  return "要先定位你目前的位置嗎？這樣地圖一打開就能直接跳到你附近。";
}

export function getGeolocationErrorMessage(error?: Pick<GeolocationPositionError, "code">): string {
  if (!error) {
    return getCurrentLocationStatusMessage("error");
  }

  switch (error.code) {
    case 1:
      return getCurrentLocationStatusMessage("denied");
    case 2:
      return "無法取得目前位置，請確認定位服務是否可用。";
    case 3:
      return "定位逾時，請再試一次。";
    default:
      return getCurrentLocationStatusMessage("error");
  }
}

export function buildCurrentLocationRecenterPlan(input: {
  currentLatitude: number;
  currentLongitude: number;
  currentZoom: number;
  targetLatitude: number;
  targetLongitude: number;
  minimumZoom?: number;
}) {
  const targetZoom = Math.max(input.currentZoom, input.minimumZoom ?? CURRENT_LOCATION_ZOOM);
  const needsMove =
    Math.abs(input.currentLatitude - input.targetLatitude) > RECENTER_EPSILON ||
    Math.abs(input.currentLongitude - input.targetLongitude) > RECENTER_EPSILON ||
    Math.abs(input.currentZoom - targetZoom) > 0.01;

  return {
    needsMove,
    targetZoom,
  };
}

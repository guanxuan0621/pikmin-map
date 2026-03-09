import type { MapViewport, MushroomLocationRecord } from "@/lib/mushrooms/types";

const EARTH_RADIUS_METERS = 6_371_000;

export function isPointInViewport(
  location: Pick<MushroomLocationRecord, "latitude" | "longitude">,
  viewport: MapViewport,
): boolean {
  return (
    location.latitude >= viewport.minLat &&
    location.latitude <= viewport.maxLat &&
    location.longitude >= viewport.minLng &&
    location.longitude <= viewport.maxLng
  );
}

export function createLocationExternalKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  origin: Pick<MushroomLocationRecord, "latitude" | "longitude">,
  target: Pick<MushroomLocationRecord, "latitude" | "longitude">,
): number {
  const latitudeDelta = toRadians(target.latitude - origin.latitude);
  const longitudeDelta = toRadians(target.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const targetLatitude = toRadians(target.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_METERS * arc;
}

export function formatDistance(distanceMeters?: number): string {
  if (distanceMeters === undefined) {
    return "距離未知";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10_000 ? 0 : 1)} km`;
}

export function parseViewport(searchParams: URLSearchParams): MapViewport {
  const minLat = Number(searchParams.get("minLat") ?? 24.99);
  const maxLat = Number(searchParams.get("maxLat") ?? 25.08);
  const minLng = Number(searchParams.get("minLng") ?? 121.49);
  const maxLng = Number(searchParams.get("maxLng") ?? 121.6);

  if ([minLat, maxLat, minLng, maxLng].some((value) => Number.isNaN(value))) {
    throw new Error("Invalid viewport query parameters.");
  }

  return { minLat, maxLat, minLng, maxLng };
}

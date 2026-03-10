"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import {
  buildMushroomApiCacheKey,
  getOrCreateMushroomApiRequest,
  getCachedMushroomsPayload,
  getVisibleMushroomsFromCachedPayload,
  setCachedMushroomsPayload,
} from "@/lib/mushrooms/client-cache";
import {
  readRememberedCurrentLocation,
  writeRememberedCurrentLocation,
} from "@/lib/mushrooms/current-location-storage";
import { formatDistance, getDistanceMeters } from "@/lib/mushrooms/geo";
import type {
  MapViewport,
  MushroomLocationRecord,
  MushroomLocationSourceLayer,
} from "@/lib/mushrooms/types";
import {
  buildCurrentLocationRecenterPlan,
  buildMushroomMarkerShortLabelMap,
  reconcileDisplayMushrooms,
  CURRENT_LOCATION_ZOOM,
  getCurrentLocationActionLabel,
  getCurrentLocationStatusMessage,
  getGeolocationErrorMessage,
  getInitialLocationPromptMessage,
  getMushroomMarkerLabel,
  getMushroomMarkerShortLabel,
  getMushroomSourceLayerLabel,
  getMushroomMarkerTone,
  MARKER_LEGEND_ITEMS,
  MUSHROOM_LAYER_ITEMS,
  shouldShowInitialLocationPrompt,
  type CurrentLocationStatus,
} from "@/lib/mushrooms/map-ui";

type ObservationFormState = {
  observerKey: string;
  title: string;
  latitude: string;
  longitude: string;
  observedAt: string;
  mushroomType: string;
  isAvailable: boolean;
};

const TILE_MAX_ZOOM = 19;
const VIEWPORT_PRECISION = 5;
const NEARBY_RADIUS_METERS = 1200;
const DEFAULT_MAP_CENTER: [number, number] = [121.53431, 25.03291];
const DEFAULT_MAP_ZOOM = 12.4;
const COMPACT_CANDIDATE_MARKER_THRESHOLD = 80;

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: TILE_MAX_ZOOM,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

type CurrentLocationState = {
  status: CurrentLocationStatus;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
};

type VisibleMushroom = MushroomLocationRecord & {
  distanceMeters?: number;
};

type LayerVisibilityState = Record<MushroomLocationSourceLayer, boolean>;

function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatViewportCoordinate(value: number): string {
  return value.toFixed(VIEWPORT_PRECISION);
}

function formatCoordinate(value?: number): string {
  if (value === undefined) {
    return "Unavailable";
  }

  return value.toFixed(5);
}

function formatAccuracy(value?: number): string {
  if (value === undefined) {
    return "Unavailable";
  }

  return `${Math.round(value)} m`;
}

function getLocationSourceLayer(location: MushroomLocationRecord): MushroomLocationSourceLayer {
  return location.sourceLayer ?? "confirmed";
}

function toViewport(bounds: maplibregl.LngLatBounds): MapViewport {
  return {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  };
}

export function MushroomMapClient() {
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const currentLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const currentLocationRef = useRef<CurrentLocationState>({
    status: "idle",
  });
  const refreshMushroomsRef = useRef<() => void>(() => {});
  const lastLocationRefreshKeyRef = useRef<string | null>(null);
  const [mushrooms, setMushrooms] = useState<MushroomLocationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocationState>({
    status: "idle",
  });
  const [hasHandledInitialLocationPrompt, setHasHandledInitialLocationPrompt] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocationHydrated, setIsLocationHydrated] = useState(false);
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [initialMapZoom, setInitialMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>({
    confirmed: true,
    candidate: true,
  });

  const [formState, setFormState] = useState<ObservationFormState>({
    observerKey: "demo-user",
    title: "",
    latitude: "25.03361",
    longitude: "121.56456",
    observedAt: toDatetimeLocalValue(new Date()),
    mushroomType: "Water",
    isAvailable: true,
  });
  const currentLatitude = currentLocation.latitude;
  const currentLongitude = currentLocation.longitude;

  const sortedMushrooms = useMemo<VisibleMushroom[]>(() => {
    const nextMushrooms = mushrooms.map((mushroom) => ({
      ...mushroom,
      distanceMeters:
        currentLocation.status === "available" &&
        currentLocation.latitude !== undefined &&
        currentLocation.longitude !== undefined
          ? getDistanceMeters(
              {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              mushroom,
            )
          : undefined,
    }));

    return nextMushrooms.sort((left, right) => {
      if (left.distanceMeters === undefined && right.distanceMeters === undefined) {
        return 0;
      }

      if (left.distanceMeters === undefined) {
        return 1;
      }

      if (right.distanceMeters === undefined) {
        return -1;
      }

      return left.distanceMeters - right.distanceMeters;
    });
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.status, mushrooms]);

  const layerCounts = useMemo(
    () =>
      sortedMushrooms.reduce<LayerVisibilityState>(
        (counts, mushroom) => {
          counts[getLocationSourceLayer(mushroom)] += 1;
          return counts;
        },
        { confirmed: 0, candidate: 0 },
      ),
    [sortedMushrooms],
  );

  const visibleMushrooms = useMemo(
    () => sortedMushrooms.filter((mushroom) => layerVisibility[getLocationSourceLayer(mushroom)]),
    [layerVisibility, sortedMushrooms],
  );
  const useCompactCandidateMarkers = layerCounts.candidate >= COMPACT_CANDIDATE_MARKER_THRESHOLD;

  const toggleLayerVisibility = useCallback((layer: MushroomLocationSourceLayer, checked: boolean) => {
    setLayerVisibility((current) => {
      if (checked) {
        return {
          ...current,
          [layer]: true,
        };
      }

      const enabledLayerCount = Object.values(current).filter(Boolean).length;

      if (enabledLayerCount <= 1 && current[layer]) {
        setFeedbackTone("error");
        setFeedback("至少保留一個圖層，避免地圖與列表全部清空。");
        return current;
      }

      return {
        ...current,
        [layer]: false,
      };
    });
  }, []);

  const selectedMushroom = useMemo(
    () => visibleMushrooms.find((mushroom) => mushroom.id === selectedId) ?? visibleMushrooms[0],
    [selectedId, visibleMushrooms],
  );

  const markerShortLabelMap = useMemo(
    () => buildMushroomMarkerShortLabelMap(visibleMushrooms),
    [visibleMushrooms],
  );

  const createMushroomMarkerElement = useCallback((mushroom: MushroomLocationRecord) => {
    const element = document.createElement("button");
    const tone = getMushroomMarkerTone(mushroom.derivedState?.currentStatus);
    const layer = getLocationSourceLayer(mushroom);
    const isCompactCandidate = layer === "candidate" && useCompactCandidateMarkers;

    element.type = "button";
    element.className = `mushroom-map-marker mushroom-map-marker--${tone} mushroom-map-marker--layer-${layer}${isCompactCandidate ? " mushroom-map-marker--compact" : ""}`;
    element.setAttribute("aria-label", getMushroomMarkerLabel(mushroom));
    element.title = mushroom.title ?? mushroom.externalKey;

    const cap = document.createElement("span");
    cap.className = "mushroom-map-marker__cap";
    const shortLabel = document.createElement("span");
    shortLabel.className = "mushroom-map-marker__short-label";
    shortLabel.textContent =
      markerShortLabelMap[mushroom.id] ?? getMushroomMarkerShortLabel(mushroom);
    const connector = document.createElement("span");
    connector.className = "mushroom-map-marker__connector";
    const dot = document.createElement("span");
    dot.className = "mushroom-map-marker__dot";

    cap.append(shortLabel);
    element.append(cap, connector, dot);
    return element;
  }, [markerShortLabelMap, useCompactCandidateMarkers]);

  const createCurrentLocationElement = useCallback(() => {
    const element = document.createElement("div");
    element.className = "current-location-marker";
    element.setAttribute("aria-label", "你的位置");

    const label = document.createElement("span");
    label.className = "current-location-marker__label";
    label.textContent = "你在這裡";
    const ring = document.createElement("span");
    ring.className = "current-location-marker__ring";
    const pulse = document.createElement("span");
    pulse.className = "current-location-marker__pulse";
    const dot = document.createElement("span");
    dot.className = "current-location-marker__dot";

    element.append(label, pulse, ring, dot);
    return element;
  }, []);

  const applySelectedMushroomToForm = useCallback((mushroom: MushroomLocationRecord) => {
    setFormState((current) => ({
      ...current,
      title: mushroom.title ?? current.title,
      latitude: mushroom.latitude.toFixed(5),
      longitude: mushroom.longitude.toFixed(5),
    }));
  }, []);

  const applyCurrentLocationToForm = useCallback(() => {
    if (currentLatitude === undefined || currentLongitude === undefined) {
      setFeedbackTone("error");
      setFeedback("請先取得目前位置，才能快速帶入你的 GPS 座標。");
      return;
    }

    setFormState((current) => ({
      ...current,
      latitude: currentLatitude.toFixed(5),
      longitude: currentLongitude.toFixed(5),
    }));
  }, [currentLatitude, currentLongitude]);

  const syncMarkers = useCallback((nextMushrooms: MushroomLocationRecord[]) => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!mapRef.current) {
      return;
    }

    markersRef.current = nextMushrooms.map((mushroom) => {
      const marker = new maplibregl.Marker({
        element: createMushroomMarkerElement(mushroom),
        anchor: "bottom",
      })
        .setLngLat([mushroom.longitude, mushroom.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${mushroom.title ?? mushroom.externalKey}</strong><br/>${getMushroomSourceLayerLabel(
              getLocationSourceLayer(mushroom),
            )}<br/>${mushroom.derivedState?.currentStatus ?? "UNKNOWN"}`,
          ),
        )
        .addTo(mapRef.current!);

      marker.getElement().addEventListener("click", () => {
        setSelectedId(mushroom.id);
        applySelectedMushroomToForm(mushroom);
      });

      return marker;
    });
  }, [createMushroomMarkerElement]);

  const syncCurrentLocationMarker = useCallback(
    (latitude?: number, longitude?: number) => {
      if (!mapRef.current || latitude === undefined || longitude === undefined) {
        currentLocationMarkerRef.current?.remove();
        currentLocationMarkerRef.current = null;
        return;
      }

      if (!currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current = new maplibregl.Marker({
          element: createCurrentLocationElement(),
          anchor: "center",
        })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
        currentLocationMarkerRef.current.getElement().style.zIndex = "30";
        currentLocationMarkerRef.current.getElement().style.pointerEvents = "none";
        return;
      }

      currentLocationMarkerRef.current.setLngLat([longitude, latitude]);
      currentLocationMarkerRef.current.getElement().style.zIndex = "30";
      currentLocationMarkerRef.current.getElement().style.pointerEvents = "none";
    },
    [createCurrentLocationElement],
  );

  const loadMushrooms = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }

    const bounds = mapRef.current.getBounds();
    const viewport = toViewport(bounds);
    const query = new URLSearchParams({
      minLat: formatViewportCoordinate(viewport.minLat),
      maxLat: formatViewportCoordinate(viewport.maxLat),
      minLng: formatViewportCoordinate(viewport.minLng),
      maxLng: formatViewportCoordinate(viewport.maxLng),
    });
    const activeLocation = currentLocationRef.current;

    if (
      activeLocation.status === "available" &&
      activeLocation.latitude !== undefined &&
      activeLocation.longitude !== undefined
    ) {
      query.set("centerLat", formatViewportCoordinate(activeLocation.latitude));
      query.set("centerLng", formatViewportCoordinate(activeLocation.longitude));
      query.set("radiusMeters", String(NEARBY_RADIUS_METERS));
    }

    const requestKey = query.toString();
    const cacheKey = buildMushroomApiCacheKey(query);
    const cachedPayload = getCachedMushroomsPayload(cacheKey);

    if (cachedPayload) {
      const visibleMushrooms = getVisibleMushroomsFromCachedPayload(cachedPayload, viewport);
      setMushrooms(visibleMushrooms);
      setSelectedId((current) =>
        visibleMushrooms.some((mushroom) => mushroom.id === current)
          ? current
          : visibleMushrooms[0]?.id ?? null,
      );
      return;
    }

    const nextCachedPayload = await getOrCreateMushroomApiRequest(cacheKey, async () => {
      const response = await fetch(`/api/mushrooms?${requestKey}`);
      const payload = (await response.json()) as {
        mushrooms: MushroomLocationRecord[];
        nearbyMushrooms?: MushroomLocationRecord[];
      };

      if (!response.ok) {
        throw new Error("Failed to fetch mushrooms for the current viewport.");
      }

      const resolvedPayload = {
        mushrooms: payload.mushrooms,
        nearbyMushrooms: payload.nearbyMushrooms,
      };

      setCachedMushroomsPayload(cacheKey, resolvedPayload);
      return resolvedPayload;
    });
    const visibleMushrooms = reconcileDisplayMushrooms(
      mushroomsRef.current,
      getVisibleMushroomsFromCachedPayload(nextCachedPayload, viewport),
    );

    lastViewportKeyRef.current = viewportKey;
    mushroomsRef.current = visibleMushrooms;
    setMushrooms(visibleMushrooms);
    setSelectedId((current) =>
      visibleMushrooms.some((mushroom) => mushroom.id === current)
        ? current
        : visibleMushrooms[0]?.id ?? null,
    );
  }, []);

  const refreshMushrooms = useCallback(() => {
    void loadMushrooms().catch((error) => {
      setFeedbackTone("error");
      setFeedback(error instanceof Error ? error.message : "Failed to refresh mushrooms.");
    });
  }, [loadMushrooms]);

  const recenterToCurrentLocation = useCallback(
    (latitude: number, longitude: number) => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      const center = map.getCenter();
      const { needsMove, targetZoom } = buildCurrentLocationRecenterPlan({
        currentLatitude: center.lat,
        currentLongitude: center.lng,
        currentZoom: map.getZoom(),
        targetLatitude: latitude,
        targetLongitude: longitude,
        minimumZoom: CURRENT_LOCATION_ZOOM,
      });

      if (!needsMove) {
        refreshMushrooms();
        return;
      }

      map.easeTo({
        center: [longitude, latitude],
        zoom: targetZoom,
        essential: true,
      });
    },
    [refreshMushrooms],
  );

  const handleCurrentLocationAction = useCallback(() => {
    if (currentLocation.status === "available" && currentLocation.latitude !== undefined && currentLocation.longitude !== undefined) {
      syncCurrentLocationMarker(currentLocation.latitude, currentLocation.longitude);
      recenterToCurrentLocation(currentLocation.latitude, currentLocation.longitude);
      return;
    }

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setCurrentLocation({
        status: "unsupported",
      });
      return;
    }

    setCurrentLocation({
      status: "requesting",
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });
    currentLocationRef.current = {
      status: "requesting",
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracyMeters: currentLocation.accuracyMeters,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const nextLocation = {
          status: "available" as const,
          latitude,
          longitude,
          accuracyMeters: position.coords.accuracy,
        };

        currentLocationRef.current = nextLocation;
        setCurrentLocation(nextLocation);
        writeRememberedCurrentLocation({
          latitude,
          longitude,
          accuracyMeters: position.coords.accuracy,
        });
        syncCurrentLocationMarker(latitude, longitude);
        recenterToCurrentLocation(latitude, longitude);
      },
      (error) => {
        const nextLocation = {
          status: error.code === 1 ? "denied" : "error",
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracyMeters: currentLocation.accuracyMeters,
        } satisfies CurrentLocationState;

        currentLocationRef.current = nextLocation;
        setCurrentLocation(nextLocation);
        setFeedbackTone("error");
        setFeedback(getGeolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }, [currentLocation, recenterToCurrentLocation, syncCurrentLocationMarker]);

  const handleInitialLocationPromptAccept = useCallback(() => {
    setHasHandledInitialLocationPrompt(true);
    handleCurrentLocationAction();
  }, [handleCurrentLocationAction]);

  const handleInitialLocationPromptDismiss = useCallback(() => {
    setHasHandledInitialLocationPrompt(true);
  }, []);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    const rememberedLocation = readRememberedCurrentLocation();

    if (rememberedLocation) {
      const nextLocation: CurrentLocationState = {
        status: "available",
        latitude: rememberedLocation.latitude,
        longitude: rememberedLocation.longitude,
        accuracyMeters: rememberedLocation.accuracyMeters,
      };

      currentLocationRef.current = nextLocation;
      setCurrentLocation(nextLocation);
      setHasHandledInitialLocationPrompt(true);
      setInitialMapCenter([rememberedLocation.longitude, rememberedLocation.latitude]);
      setInitialMapZoom(CURRENT_LOCATION_ZOOM);
    }

    setIsLocationHydrated(true);
  }, []);

  useEffect(() => {
    refreshMushroomsRef.current = refreshMushrooms;
  }, [refreshMushrooms]);

  useEffect(() => {
    if (!isLocationHydrated || mapRef.current || !mapContainerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: initialMapCenter,
      zoom: initialMapZoom,
      maxZoom: TILE_MAX_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.on("error", (event) => {
      setFeedbackTone("error");
      setFeedback(
        event.error?.message
          ? `Map failed to load: ${event.error.message}`
          : "Map failed to load. Please refresh the page.",
      );
    });
    map.on("load", () => {
      setIsMapReady(true);
      refreshMushroomsRef.current();
    });
    map.on("moveend", () => {
      refreshMushroomsRef.current();
    });
    map.on("click", (event) => {
      setSelectedId(null);
      setFormState((current) => ({
        ...current,
        latitude: event.lngLat.lat.toFixed(5),
        longitude: event.lngLat.lng.toFixed(5),
      }));
    });

    mapRef.current = map;

    return () => {
      setIsMapReady(false);
      currentLocationMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [initialMapCenter, initialMapZoom, isLocationHydrated]);

  useEffect(() => {
    syncCurrentLocationMarker(currentLocation.latitude, currentLocation.longitude);
  }, [currentLocation.latitude, currentLocation.longitude, syncCurrentLocationMarker]);

  useEffect(() => {
    syncMarkers(visibleMushrooms);
  }, [syncMarkers, visibleMushrooms]);

  useEffect(() => {
    if (
      currentLocation.status !== "available" ||
      currentLocation.latitude === undefined ||
      currentLocation.longitude === undefined
    ) {
      lastLocationRefreshKeyRef.current = null;
      return;
    }

    const locationRefreshKey = `${currentLocation.latitude.toFixed(5)}:${currentLocation.longitude.toFixed(5)}`;

    if (lastLocationRefreshKeyRef.current === locationRefreshKey) {
      return;
    }

    lastLocationRefreshKeyRef.current = locationRefreshKey;
    refreshMushroomsRef.current();
  }, [currentLocation.latitude, currentLocation.longitude, currentLocation.status]);

  const showInitialLocationPrompt =
    isLocationHydrated &&
    shouldShowInitialLocationPrompt({
      currentLocationStatus: currentLocation.status,
      hasHandledPrompt: hasHandledInitialLocationPrompt,
      isMapReady,
    });

  const submitObservation = useCallback(async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          observerKey: formState.observerKey,
          observedAt: new Date(formState.observedAt).toISOString(),
          isAvailable: formState.isAvailable,
          mushroomType: formState.mushroomType || undefined,
          location: {
            title: formState.title || undefined,
            latitude: Number(formState.latitude),
            longitude: Number(formState.longitude),
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedbackTone("error");
        setFeedback(payload.error ?? "Observation submission failed.");
        return;
      }

      setFeedbackTone("success");
      setFeedback("Observation accepted and refresh queued.");
      refreshMushrooms();
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(error instanceof Error ? error.message : "Observation submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, refreshMushrooms]);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Pikmin Mushroom Map</p>
        <h1>互動式地圖 MVP</h1>
        <p className="hero-copy">
          拖曳地圖會重新查詢目前視窗內的 Mushroom。你可以手動要求定位目前位置，並切換「已確認蘑菇」與「潛在候選點」兩個圖層，快速判斷哪些點已被回報、哪些仍待確認。
        </p>
      </section>

      <section className="app-grid">
        <div className="map-card">
          <div className="map-overlay">
            {showInitialLocationPrompt ? (
              <div className="initial-location-prompt">
                <strong>先定位你的位置？</strong>
                <p>{getInitialLocationPromptMessage()}</p>
                <div className="initial-location-prompt__actions">
                  <button
                    className="location-button"
                    onClick={handleInitialLocationPromptAccept}
                    type="button"
                  >
                    定位我目前位置
                  </button>
                  <button
                    className="secondary-button secondary-button--ghost"
                    onClick={handleInitialLocationPromptDismiss}
                    type="button"
                  >
                    先看地圖
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="location-button"
                  disabled={currentLocation.status === "requesting"}
                  onClick={() => {
                    setHasHandledInitialLocationPrompt(true);
                    handleCurrentLocationAction();
                  }}
                  type="button"
                >
                  {getCurrentLocationActionLabel(currentLocation.status)}
                </button>
                <p className={`location-status location-status--${currentLocation.status}`}>
                  {getCurrentLocationStatusMessage(currentLocation.status)}
                </p>
              </>
            )}
          </div>
          <div ref={mapContainerRef} className="map-surface" data-testid="map-surface" />
        </div>

        <aside className="sidebar">
          <section className="panel">
            <div className="panel-header">
              <h2>目前位置</h2>
              <span>{currentLocation.status === "available" ? "GPS" : "Pending"}</span>
            </div>
            <div className="details compact-details">
              <div>
                <dt>Latitude</dt>
                <dd>{formatCoordinate(currentLocation.latitude)}</dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd>{formatCoordinate(currentLocation.longitude)}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{formatAccuracy(currentLocation.accuracyMeters)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{getCurrentLocationStatusMessage(currentLocation.status)}</dd>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>圖層</h2>
              <span>{visibleMushrooms.length} visible</span>
            </div>
            <p className="panel-copy">
              已確認蘑菇會保留實際回報位置；候選點則是附近可能生成蘑菇、但尚未被玩家確認的 POI。
            </p>
            <div className="layer-toggle-list">
              {MUSHROOM_LAYER_ITEMS.map((item) => (
                <label key={item.layer} className="layer-toggle">
                  <input
                    checked={layerVisibility[item.layer]}
                    className="layer-toggle__input"
                    onChange={(event) => toggleLayerVisibility(item.layer, event.target.checked)}
                    type="checkbox"
                  />
                  <span className={`layer-toggle__swatch layer-toggle__swatch--${item.layer}`} />
                  <div className="layer-toggle__content">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                  <span className="layer-toggle__count">{layerCounts[item.layer]}</span>
                  <span className="layer-toggle__switch" aria-hidden="true">
                    <span className="layer-toggle__switch-thumb" />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>圖例</h2>
            <div className="legend-list">
              {MARKER_LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="legend-item">
                  <span className={`legend-swatch legend-swatch--${item.tone}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Visible mushrooms</h2>
              <span>
                {visibleMushrooms.length} / {sortedMushrooms.length}
              </span>
            </div>
            <p className="panel-copy">
              {currentLocation.status === "available"
                ? "已依照離你最近的順序排序，並保留目前圖層篩選。"
                : "定位後可顯示距離並依最近排序。"}
            </p>

            <div className="mushroom-list">
              {visibleMushrooms.map((mushroom) => (
                <button
                  key={mushroom.id}
                  className={`mushroom-row ${selectedMushroom?.id === mushroom.id ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelectedId(mushroom.id);
                    applySelectedMushroomToForm(mushroom);
                  }}
                  type="button"
                >
                  <strong>{mushroom.title ?? mushroom.externalKey}</strong>
                  <span className={`source-badge source-badge--${getLocationSourceLayer(mushroom)}`}>
                    {getMushroomSourceLayerLabel(getLocationSourceLayer(mushroom))}
                  </span>
                  <span
                    className={`status-badge status-badge--${getMushroomMarkerTone(
                      mushroom.derivedState?.currentStatus,
                    )}`}
                  >
                    {mushroom.derivedState?.currentStatus ?? "UNKNOWN"}
                  </span>
                  <span className="distance-label">距離你：{formatDistance(mushroom.distanceMeters)}</span>
                  <span>Observed: {formatDate(mushroom.derivedState?.lastObservedAt)}</span>
                  <span>
                    Prediction:{" "}
                    {mushroom.prediction?.status === "AVAILABLE"
                      ? formatDate(
                          mushroom.prediction.predictedCompletionTime ??
                            mushroom.prediction.predictedNextSpawnTime,
                        )
                      : "Unavailable"}
                  </span>
                </button>
              ))}
              {visibleMushrooms.length === 0 ? (
                <p className="empty-state">目前沒有符合已開啟圖層的點位。</p>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Report observation</h2>
              <span>{selectedMushroom ? "已選取目標" : "可手動輸入"}</span>
            </div>
            <p className="panel-copy">
              最簡單的回報方式是先點地圖上的蘑菇或右側清單，再確認時間與狀態後送出。若你要新增一個還沒出現在地圖上的點，也可以直接點地圖空白處帶入座標。
            </p>
            <div className="report-helper">
              <div className="report-helper__summary">
                <strong>{selectedMushroom?.title ?? "尚未選取蘑菇"}</strong>
                <span data-testid="form-coordinate-summary">
                  目前表單座標：{formState.latitude}, {formState.longitude}
                </span>
              </div>
              <div className="report-helper__actions">
                <button
                  className="secondary-button"
                  disabled={!selectedMushroom}
                  onClick={() => {
                    if (selectedMushroom) {
                      applySelectedMushroomToForm(selectedMushroom);
                    }
                  }}
                  type="button"
                >
                  帶入選取蘑菇位置
                </button>
                <button className="secondary-button" onClick={applyCurrentLocationToForm} type="button">
                  帶入我的位置
                </button>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Observer key
                <input
                  value={formState.observerKey}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, observerKey: event.target.value }))
                  }
                />
              </label>
              <label>
                Title
                <input
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Latitude
                <input
                  value={formState.latitude}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, latitude: event.target.value }))
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  value={formState.longitude}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, longitude: event.target.value }))
                  }
                />
              </label>
              <label>
                Observed at
                <input
                  type="datetime-local"
                  value={formState.observedAt}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, observedAt: event.target.value }))
                  }
                />
              </label>
              <label>
                Mushroom type
                <input
                  value={formState.mushroomType}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, mushroomType: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={formState.isAvailable}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, isAvailable: event.target.checked }))
                }
              />
              Mushroom is currently available
            </label>

            <button className="submit-button" disabled={isSubmitting} onClick={submitObservation} type="button">
              {isSubmitting ? "Submitting..." : "Submit observation"}
            </button>

            {feedback ? (
              <p className={`feedback ${feedbackTone === "success" ? "is-success" : "is-error"}`}>
                {feedback}
              </p>
            ) : null}
          </section>
        </aside>
      </section>
    </main>
  );
}

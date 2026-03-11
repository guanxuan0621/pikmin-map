import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMushroomMarkerShortLabelMap,
  buildCurrentLocationRecenterPlan,
  getCurrentLocationActionLabel,
  getCurrentLocationStatusMessage,
  getGeolocationErrorMessage,
  getInitialLocationPromptMessage,
  getMushroomMarkerTone,
  getMushroomMarkerShortLabel,
  getMushroomSourceLayerLabel,
  MARKER_LEGEND_ITEMS,
  shouldShowInitialLocationPrompt,
} from "../src/lib/mushrooms/map-ui";

test("getMushroomMarkerTone maps active, defeated, and unknown states", () => {
  assert.equal(getMushroomMarkerTone("ACTIVE"), "active");
  assert.equal(getMushroomMarkerTone("DEFEATED"), "defeated");
  assert.equal(getMushroomMarkerTone(undefined), "unknown");
});

test("getCurrentLocationActionLabel reflects request and recenter states", () => {
  assert.equal(getCurrentLocationActionLabel("idle"), "定位我目前位置");
  assert.equal(getCurrentLocationActionLabel("requesting"), "定位中...");
  assert.equal(getCurrentLocationActionLabel("available"), "回到我的位置");
});

test("getCurrentLocationStatusMessage returns non-blocking fallback guidance", () => {
  assert.match(getCurrentLocationStatusMessage("idle"), /尚未使用定位/);
  assert.match(getCurrentLocationStatusMessage("denied"), /拒絕定位權限/);
  assert.match(getCurrentLocationStatusMessage("unsupported"), /不支援定位/);
});

test("getGeolocationErrorMessage distinguishes denial, unavailable, and timeout cases", () => {
  assert.match(getGeolocationErrorMessage({ code: 1 }), /拒絕定位權限/);
  assert.match(getGeolocationErrorMessage({ code: 2 }), /無法取得目前位置/);
  assert.match(getGeolocationErrorMessage({ code: 3 }), /定位逾時/);
});

test("shouldShowInitialLocationPrompt only returns true for the initial idle map state", () => {
  assert.equal(
    shouldShowInitialLocationPrompt({
      currentLocationStatus: "idle",
      hasHandledPrompt: false,
      isMapReady: true,
    }),
    true,
  );

  assert.equal(
    shouldShowInitialLocationPrompt({
      currentLocationStatus: "available",
      hasHandledPrompt: false,
      isMapReady: true,
    }),
    false,
  );

  assert.equal(
    shouldShowInitialLocationPrompt({
      currentLocationStatus: "idle",
      hasHandledPrompt: true,
      isMapReady: true,
    }),
    false,
  );
});

test("getInitialLocationPromptMessage explains the first-open location choice", () => {
  assert.match(getInitialLocationPromptMessage(), /定位/);
  assert.match(getInitialLocationPromptMessage(), /地圖一打開/);
});

test("marker legend includes current location and mushroom state guidance", () => {
  assert.deepEqual(
    MARKER_LEGEND_ITEMS.map((item) => item.tone),
    ["current-location", "active", "defeated", "unknown"],
  );
});

test("getMushroomSourceLayerLabel distinguishes confirmed and candidate layers", () => {
  assert.equal(getMushroomSourceLayerLabel("confirmed"), "已確認蘑菇");
  assert.equal(getMushroomSourceLayerLabel("candidate"), "潛在候選點");
});

test("getMushroomMarkerShortLabel returns readable short names for common POI titles", () => {
  assert.equal(
    getMushroomMarkerShortLabel({
      id: "1",
      externalKey: "35.57769:139.64036",
      title: "セブン-イレブン (OSM POI)",
      latitude: 35.57769,
      longitude: 139.64036,
    }),
    "セブン",
  );

  assert.equal(
    getMushroomMarkerShortLabel({
      id: "2",
      externalKey: "35.57806:139.64032",
      title: "BIG FOOT (OSM POI)",
      latitude: 35.57806,
      longitude: 139.64032,
    }),
    "BF",
  );

  assert.equal(
    getMushroomMarkerShortLabel({
      id: "3",
      externalKey: "35.58053:139.64177",
      title: "東横イン (Toyoko Inn) (OSM POI)",
      latitude: 35.58053,
      longitude: 139.64177,
    }),
    "東横イン",
  );
});

test("buildCurrentLocationRecenterPlan requests viewport updates when location changes or zoom is too low", () => {
  assert.deepEqual(
    buildCurrentLocationRecenterPlan({
      currentLatitude: 25.033,
      currentLongitude: 121.565,
      currentZoom: 12,
      targetLatitude: 25.034,
      targetLongitude: 121.566,
    }),
    {
      needsMove: true,
      targetZoom: 14,
    },
  );

  assert.deepEqual(
    buildCurrentLocationRecenterPlan({
      currentLatitude: 25.033,
      currentLongitude: 121.565,
      currentZoom: 15,
      targetLatitude: 25.033,
      targetLongitude: 121.565,
    }),
    {
      needsMove: false,
      targetZoom: 15,
    },
  );
});

test("buildMushroomMarkerShortLabelMap disambiguates duplicate short labels", () => {
  const labelMap = buildMushroomMarkerShortLabelMap([
    {
      id: "a",
      externalKey: "1",
      title: "とんかつ武蔵 (OSM POI)",
      latitude: 35.58,
      longitude: 139.64,
    },
    {
      id: "b",
      externalKey: "2",
      title: "とんかつ野ぶ太 (OSM POI)",
      latitude: 35.57,
      longitude: 139.63,
    },
  ]);

  assert.notEqual(labelMap.a, labelMap.b);
  assert.match(labelMap.a ?? "", /^とんか[12]$/);
  assert.match(labelMap.b ?? "", /^とんか[12]$/);
});

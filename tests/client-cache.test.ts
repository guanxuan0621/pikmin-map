import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMushroomApiCacheKey,
  clearMushroomApiRequestDeduperForTest,
  getOrCreateMushroomApiRequest,
  getVisibleMushroomsFromCachedPayload,
  pruneMushroomApiCacheEntriesForTest,
  shouldSkipNearbyEmptyCachePayloadForTest,
} from "../src/lib/mushrooms/client-cache";

test("buildMushroomApiCacheKey reuses a nearby key for small viewport changes around the same location", () => {
  const left = new URLSearchParams({
    minLat: "35.56700",
    maxLat: "35.58743",
    minLng: "139.61715",
    maxLng: "139.64236",
    centerLat: "35.57767",
    centerLng: "139.63409",
    radiusMeters: "1200",
  });
  const right = new URLSearchParams({
    minLat: "35.56704",
    maxLat: "35.58739",
    minLng: "139.61719",
    maxLng: "139.64234",
    centerLat: "35.57770",
    centerLng: "139.63411",
    radiusMeters: "1188",
  });

  assert.equal(buildMushroomApiCacheKey(left), buildMushroomApiCacheKey(right));
});

test("getVisibleMushroomsFromCachedPayload filters a cached nearby dataset by the current viewport", () => {
  const visible = getVisibleMushroomsFromCachedPayload(
    {
      mushrooms: [],
      nearbyMushrooms: [
        {
          id: "inside",
          externalKey: "35.57769:139.64036",
          title: "Inside",
          latitude: 35.57769,
          longitude: 139.64036,
        },
        {
          id: "outside",
          externalKey: "35.59000:139.65000",
          title: "Outside",
          latitude: 35.59,
          longitude: 139.65,
        },
      ],
    },
    {
      minLat: 35.567,
      maxLat: 35.5875,
      minLng: 139.617,
      maxLng: 139.6425,
    },
  );

  assert.deepEqual(
    visible.map((location) => location.id),
    ["inside"],
  );
});

test("nearby cache skips persisting an empty payload that would poison future map refreshes", () => {
  assert.equal(
    shouldSkipNearbyEmptyCachePayloadForTest("nearby:35.578:139.634:radius:1200", {
      mushrooms: [],
      nearbyMushrooms: [],
    }),
    true,
  );

  assert.equal(
    shouldSkipNearbyEmptyCachePayloadForTest("nearby:35.578:139.634:radius:1200", {
      mushrooms: [],
      nearbyMushrooms: [{ id: "1", externalKey: "1", latitude: 35.57, longitude: 139.63 }],
    }),
    false,
  );

  assert.equal(
    shouldSkipNearbyEmptyCachePayloadForTest("viewport:35.567:35.587:139.617:139.642", {
      mushrooms: [],
    }),
    false,
  );
});

test("getOrCreateMushroomApiRequest deduplicates concurrent requests for the same cache key", async () => {
  clearMushroomApiRequestDeduperForTest();

  let loaderCallCount = 0;
  const loader = async () => {
    loaderCallCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      mushrooms: [{ id: "1", externalKey: "1", latitude: 35.57, longitude: 139.63 }],
    };
  };

  const [left, right] = await Promise.all([
    getOrCreateMushroomApiRequest("nearby:35.578:139.634:radius:1200", loader),
    getOrCreateMushroomApiRequest("nearby:35.578:139.634:radius:1200", loader),
  ]);

  assert.equal(loaderCallCount, 1);
  assert.deepEqual(left, right);
});

test("pruneMushroomApiCacheEntriesForTest removes expired entries and limits cache size", () => {
  const now = 1_000_000;
  const entries = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => [
      `entry-${index}`,
      {
        savedAt: now - index * 1_000,
        payload: { mushrooms: [] },
      },
    ]),
  );

  entries["expired-entry"] = {
    savedAt: now - 11 * 60 * 1_000,
    payload: { mushrooms: [] },
  };

  const pruned = pruneMushroomApiCacheEntriesForTest(entries, now);

  assert.equal(Object.keys(pruned).length, 15);
  assert.ok(!("expired-entry" in pruned));
  assert.ok("entry-0" in pruned);
});

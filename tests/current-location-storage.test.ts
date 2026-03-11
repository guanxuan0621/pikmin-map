import test from "node:test";
import assert from "node:assert/strict";

import {
  readRememberedCurrentLocation,
  rememberedCurrentLocationStorageKeyForTest,
  rememberedCurrentLocationTtlMsForTest,
  writeRememberedCurrentLocation,
} from "../src/lib/mushrooms/current-location-storage";

test("readRememberedCurrentLocation returns a recent stored location", () => {
  const storage = new Map<string, string>();
  const originalWindow = globalThis.window;

  globalThis.window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      key: () => null,
      length: 0,
    },
  } as Window;

  try {
    writeRememberedCurrentLocation(
      {
        latitude: 35.57767,
        longitude: 139.63409,
        accuracyMeters: 18,
      },
      1_000,
    );

    assert.deepEqual(readRememberedCurrentLocation(2_000), {
      latitude: 35.57767,
      longitude: 139.63409,
      accuracyMeters: 18,
      savedAt: 1_000,
    });
  } finally {
    globalThis.window = originalWindow;
  }
});

test("readRememberedCurrentLocation drops expired stored locations", () => {
  const storage = new Map<string, string>();
  const originalWindow = globalThis.window;

  globalThis.window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      key: () => null,
      length: 0,
    },
  } as Window;

  try {
    storage.set(
      rememberedCurrentLocationStorageKeyForTest,
      JSON.stringify({
        latitude: 35.57767,
        longitude: 139.63409,
        savedAt: 1_000,
      }),
    );

    assert.equal(readRememberedCurrentLocation(1_000 + rememberedCurrentLocationTtlMsForTest), null);
    assert.equal(storage.has(rememberedCurrentLocationStorageKeyForTest), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

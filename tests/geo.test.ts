import test from "node:test";
import assert from "node:assert/strict";

import { formatDistance, getDistanceMeters } from "../src/lib/mushrooms/geo";

test("getDistanceMeters returns approximately zero for identical coordinates", () => {
  const distance = getDistanceMeters(
    { latitude: 35.4437, longitude: 139.638 },
    { latitude: 35.4437, longitude: 139.638 },
  );

  assert.ok(distance < 0.01);
});

test("getDistanceMeters returns a realistic positive distance between nearby points", () => {
  const distance = getDistanceMeters(
    { latitude: 35.4437, longitude: 139.638 },
    { latitude: 35.4485, longitude: 139.6422 },
  );

  assert.ok(distance > 500);
  assert.ok(distance < 800);
});

test("formatDistance returns meters and kilometers with readable labels", () => {
  assert.equal(formatDistance(undefined), "距離未知");
  assert.equal(formatDistance(245), "245 m");
  assert.equal(formatDistance(1240), "1.2 km");
  assert.equal(formatDistance(12_400), "12 km");
});

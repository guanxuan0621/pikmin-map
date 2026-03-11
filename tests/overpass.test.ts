import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOverpassNearbyQuery,
  buildOverpassQuery,
  mapOverpassResponseToLocations,
} from "../src/lib/mushrooms/overpass";

test("buildOverpassQuery includes viewport bounds and supported tag filters", () => {
  const query = buildOverpassQuery({
    minLat: 35.57,
    maxLat: 35.58,
    minLng: 139.63,
    maxLng: 139.64,
  });

  assert.match(query, /35\.57,139\.63,35\.58,139\.64/);
  assert.match(query, /amenity/);
  assert.match(query, /place_of_worship/);
  assert.match(query, /shop/);
  assert.match(query, /tourism/);
  assert.match(query, /out center/);
});

test("buildOverpassNearbyQuery includes around center and radius", () => {
  const query = buildOverpassNearbyQuery({
    latitude: 35.57764,
    longitude: 139.63402,
    radiusMeters: 1200,
  });

  assert.match(query, /around:1200,35\.57764,139\.63402/);
  assert.match(query, /place_of_worship/);
  assert.match(query, /shop/);
  assert.match(query, /railway/);
});

test("mapOverpassResponseToLocations maps node and way results into mushroom records", () => {
  const locations = mapOverpassResponseToLocations({
    elements: [
      {
        id: 1,
        type: "node",
        lat: 35.5776917,
        lon: 139.6403645,
        tags: {
          name: "セブン-イレブン",
          shop: "convenience",
        },
      },
      {
        id: 2,
        type: "way",
        center: {
          lat: 35.5802046,
          lon: 139.6425627,
        },
        tags: {
          name: "上小田中郵便局",
          amenity: "post_office",
        },
      },
    ],
  });

  assert.equal(locations.length, 2);
  assert.equal(locations[0]?.title, "セブン-イレブン (OSM POI)");
  assert.equal(locations[1]?.title, "上小田中郵便局 (OSM POI)");
  assert.equal(locations[0]?.externalKey, "35.57769:139.64036");
  assert.equal(locations[0]?.sourceLayer, "candidate");
});

test("mapOverpassResponseToLocations deduplicates by external key", () => {
  const locations = mapOverpassResponseToLocations({
    elements: [
      {
        id: 1,
        type: "node",
        lat: 35.5776917,
        lon: 139.6403645,
        tags: {
          name: "A",
        },
      },
      {
        id: 2,
        type: "node",
        lat: 35.5776917,
        lon: 139.6403645,
        tags: {
          name: "B",
        },
      },
    ],
  });

  assert.equal(locations.length, 1);
});

test("mapOverpassResponseToLocations prefers a nearby node over the same named way", () => {
  const locations = mapOverpassResponseToLocations({
    elements: [
      {
        id: 10,
        type: "way",
        center: {
          lat: 35.5777,
          lon: 139.6341,
        },
        tags: {
          name: "ローソン",
          shop: "convenience",
        },
      },
      {
        id: 11,
        type: "node",
        lat: 35.57775,
        lon: 139.63415,
        tags: {
          name: "ローソン",
          shop: "convenience",
        },
      },
    ],
  });

  assert.equal(locations.length, 1);
  assert.equal(locations[0]?.id, "overpass-node-11");
});

test("mapOverpassResponseToLocations keeps place of worship POIs as candidates", () => {
  const locations = mapOverpassResponseToLocations({
    elements: [
      {
        id: 99,
        type: "node",
        lat: 35.5775,
        lon: 139.6339,
        tags: {
          name: "全龍寺",
          amenity: "place_of_worship",
          religion: "buddhist",
        },
      },
    ],
  });

  assert.equal(locations.length, 1);
  assert.equal(locations[0]?.title, "全龍寺 (OSM POI)");
  assert.equal(locations[0]?.sourceLayer, "candidate");
});

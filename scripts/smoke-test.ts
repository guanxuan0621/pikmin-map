const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

async function expectOk(response: Response, message: string) {
  if (!response.ok) {
    throw new Error(`${message}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const runId = Date.now();
  const latOffset = (runId % 1000) / 100000;
  const lngOffset = (Math.floor(runId / 1000) % 1000) / 100000;
  const homeResponse = await fetch(baseUrl);
  const homeHtml = await homeResponse.text();

  if (!homeResponse.ok) {
    throw new Error(`Homepage request failed: ${homeResponse.status} ${homeResponse.statusText}`);
  }

  if (!homeHtml.includes("定位我目前位置")) {
    throw new Error("Homepage did not render the current location control.");
  }

  if (!homeHtml.includes("圖例")) {
    throw new Error("Homepage did not render the marker legend.");
  }

  const initialResponse = await fetch(
    `${baseUrl}/api/mushrooms?minLat=24.99&maxLat=25.08&minLng=121.49&maxLng=121.60`,
  );
  const initialPayload = (await expectOk(initialResponse, "Initial mushroom query failed")) as {
    mushrooms: Array<{ id: string }>;
  };

  const location = {
    title: `Smoke Test Location ${runId}`,
    latitude: 25.04123 + latOffset,
    longitude: 121.55234 + lngOffset,
  };

  const firstObservationResponse = await fetch(`${baseUrl}/api/observations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observerKey: "smoke-test-user",
      observedAt: "2026-03-09T06:10:00.000Z",
      isAvailable: true,
      mushroomType: "Crystal",
      location,
    }),
  });
  const firstObservationPayload = (await expectOk(
    firstObservationResponse,
    "First observation submission failed",
  )) as {
    observation: { derivedConflictsWithCurrentState: boolean };
    location: { prediction?: { status?: string } };
  };

  if (firstObservationPayload.observation.derivedConflictsWithCurrentState) {
    throw new Error("First observation unexpectedly conflicted with current state.");
  }

  if (firstObservationPayload.location.prediction?.status !== "UNAVAILABLE") {
    throw new Error("First observation should keep prediction unavailable with insufficient data.");
  }

  const secondObservationResponse = await fetch(`${baseUrl}/api/observations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      observerKey: "smoke-test-user-2",
      observedAt: "2026-03-09T06:14:00.000Z",
      isAvailable: false,
      mushroomType: "Crystal",
      location,
    }),
  });
  const secondObservationPayload = (await expectOk(
    secondObservationResponse,
    "Second observation submission failed",
  )) as {
    observation: { derivedConflictsWithCurrentState: boolean };
  };

  if (!secondObservationPayload.observation.derivedConflictsWithCurrentState) {
    throw new Error("Second observation should be marked as conflicting.");
  }

  const finalResponse = await fetch(
    `${baseUrl}/api/mushrooms?minLat=24.99&maxLat=25.08&minLng=121.49&maxLng=121.60`,
  );
  const finalPayload = (await expectOk(finalResponse, "Final mushroom query failed")) as {
    mushrooms: Array<{
      title?: string;
      prediction?: { status?: string; provenance?: string };
      derivedState?: { currentStatus?: string };
    }>;
  };

  if (finalPayload.mushrooms.length <= initialPayload.mushrooms.length) {
    throw new Error("Smoke test location was not returned by the final mushroom query.");
  }

  const smokeLocation = finalPayload.mushrooms.find((mushroom) => mushroom.title === location.title);

  if (!smokeLocation) {
    throw new Error("Smoke test location was missing from the final result set.");
  }

  if (!smokeLocation.derivedState?.currentStatus) {
    throw new Error("Derived state was not populated for the smoke test location.");
  }

  if (!smokeLocation.prediction?.status) {
    throw new Error("Prediction metadata was not returned for the smoke test location.");
  }

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

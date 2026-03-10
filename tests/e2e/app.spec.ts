import { expect, test } from "@playwright/test";

function centerOf(box: { x: number; y: number; width: number; height: number }) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

test.describe("Pikmin map app", () => {
  test("dragging the map keeps an existing mushroom marker moving with the map instead of jumping to another quadrant", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "互動式地圖 MVP" })).toBeVisible();

    const mapSurface = page.getByTestId("map-surface");
    await expect(mapSurface).toBeVisible();

    const marker = page.locator(".mushroom-map-marker").first();
    await expect(marker).toBeVisible({ timeout: 15_000 });

    const mapBoxBefore = await mapSurface.boundingBox();
    const markerBoxBefore = await marker.boundingBox();

    if (!mapBoxBefore || !markerBoxBefore) {
      throw new Error("Failed to capture map or marker bounds before dragging.");
    }

    const markerCenterBefore = centerOf(markerBoxBefore);
    const horizontalDirectionBefore = markerCenterBefore.x - (mapBoxBefore.x + mapBoxBefore.width / 2);
    const verticalDirectionBefore = markerCenterBefore.y - (mapBoxBefore.y + mapBoxBefore.height / 2);

    const dragStart = {
      x: mapBoxBefore.x + mapBoxBefore.width * 0.68,
      y: mapBoxBefore.y + mapBoxBefore.height * 0.38,
    };
    const dragEnd = {
      x: dragStart.x - 170,
      y: dragStart.y - 110,
    };

    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(700);

    await expect(marker).toBeVisible();

    const mapBoxAfter = await mapSurface.boundingBox();
    const markerBoxAfter = await marker.boundingBox();

    if (!mapBoxAfter || !markerBoxAfter) {
      throw new Error("Failed to capture map or marker bounds after dragging.");
    }

    const markerCenterAfter = centerOf(markerBoxAfter);
    const markerDeltaX = markerCenterAfter.x - markerCenterBefore.x;
    const markerDeltaY = markerCenterAfter.y - markerCenterBefore.y;
    const dragDeltaX = dragEnd.x - dragStart.x;
    const dragDeltaY = dragEnd.y - dragStart.y;

    expect(Math.abs(markerDeltaX)).toBeGreaterThan(40);
    expect(Math.abs(markerDeltaY)).toBeGreaterThan(20);
    expect(Math.sign(markerDeltaX)).toBe(Math.sign(dragDeltaX));
    expect(Math.sign(markerDeltaY)).toBe(Math.sign(dragDeltaY));

    const horizontalDirectionAfter = markerCenterAfter.x - (mapBoxAfter.x + mapBoxAfter.width / 2);
    const verticalDirectionAfter = markerCenterAfter.y - (mapBoxAfter.y + mapBoxAfter.height / 2);

    if (Math.abs(horizontalDirectionBefore) > 20) {
      expect(Math.sign(horizontalDirectionAfter)).toBe(Math.sign(horizontalDirectionBefore));
    }

    if (Math.abs(verticalDirectionBefore) > 20) {
      expect(Math.sign(verticalDirectionAfter)).toBe(Math.sign(verticalDirectionBefore));
    }

    expect(markerCenterAfter.x).toBeGreaterThanOrEqual(mapBoxAfter.x - 10);
    expect(markerCenterAfter.x).toBeLessThanOrEqual(mapBoxAfter.x + mapBoxAfter.width + 10);
    expect(markerCenterAfter.y).toBeGreaterThanOrEqual(mapBoxAfter.y - 10);
    expect(markerCenterAfter.y).toBeLessThanOrEqual(mapBoxAfter.y + mapBoxAfter.height + 10);
  });

  test("manual map-picked coordinates survive viewport refresh instead of being overwritten by the selected mushroom", async ({ page }) => {
    await page.goto("/");

    const mapSurface = page.getByTestId("map-surface");
    const mushroomRows = page.locator(".mushroom-list .mushroom-row");
    const latitudeInput = page.getByLabel("Latitude");
    const longitudeInput = page.getByLabel("Longitude");
    const summary = page.getByTestId("form-coordinate-summary");

    await expect(mapSurface).toBeVisible();
    await expect(mushroomRows.first()).toBeVisible({ timeout: 15_000 });

    await mushroomRows.first().click();
    await expect(latitudeInput).toHaveValue("25.03361");
    await expect(longitudeInput).toHaveValue("121.56456");

    await mapSurface.click({ position: { x: 180, y: 180 } });

    const pickedLatitude = await latitudeInput.inputValue();
    const pickedLongitude = await longitudeInput.inputValue();

    expect(pickedLatitude).not.toBe("25.03361");
    expect(pickedLongitude).not.toBe("121.56456");
    await expect(summary).toContainText(`${pickedLatitude}, ${pickedLongitude}`);

    const mapBox = await mapSurface.boundingBox();

    if (!mapBox) {
      throw new Error("Failed to capture map bounds before refresh drag.");
    }

    const dragStart = {
      x: mapBox.x + mapBox.width * 0.55,
      y: mapBox.y + mapBox.height * 0.52,
    };
    const dragEnd = {
      x: dragStart.x - 120,
      y: dragStart.y + 80,
    };

    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 16 });
    await page.mouse.up();

    await expect(latitudeInput).toHaveValue(pickedLatitude);
    await expect(longitudeInput).toHaveValue(pickedLongitude);
    await expect(summary).toContainText(`${pickedLatitude}, ${pickedLongitude}`);
  });
});

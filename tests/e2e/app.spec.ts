import { expect, test } from "@playwright/test";

test.describe("Pikmin map app", () => {
  test("loads the MVP screen, lets the user click the map, and submits an observation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "互動式地圖 MVP" })).toBeVisible();
    await expect(page.getByRole("button", { name: "定位我目前位置" })).toBeVisible();
    await expect(page.getByTestId("map-surface")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Report observation" })).toBeVisible();

    const latitudeInput = page.getByLabel("Latitude");
    const longitudeInput = page.getByLabel("Longitude");
    const titleInput = page.getByLabel("Title");
    const coordinateSummary = page.getByTestId("form-coordinate-summary");
    const mapSurface = page.getByTestId("map-surface");

    const initialLatitude = await latitudeInput.inputValue();
    const initialLongitude = await longitudeInput.inputValue();

    await mapSurface.click({ position: { x: 220, y: 220 } });

    await expect.poll(async () => await latitudeInput.inputValue()).not.toBe(initialLatitude);
    await expect.poll(async () => await longitudeInput.inputValue()).not.toBe(initialLongitude);

    const clickedLatitude = await latitudeInput.inputValue();
    const clickedLongitude = await longitudeInput.inputValue();

    await expect(coordinateSummary).toContainText(`${clickedLatitude}, ${clickedLongitude}`);

    const title = `Playwright smoke ${Date.now()}`;
    await titleInput.fill(title);

    await page.getByRole("button", { name: "Submit observation" }).click();

    await expect(page.getByText("Observation accepted and refresh queued.")).toBeVisible();
    await expect(titleInput).toHaveValue(title);
    await expect(coordinateSummary).toContainText(`${clickedLatitude}, ${clickedLongitude}`);
  });
});

## 1. First-Open Prompt UI

- [x] 1.1 Implement `Use an in-app first-open location prompt` for `Users can request their current location`
- [x] 1.2 Implement `Users can dismiss the initial location prompt` with explicit locate and skip actions
- [x] 1.3 Update the modified `Users can browse nearby mushroom locations on a map` flow so the first-open prompt does not block default map browsing

## 2. Geolocation Trigger Integration

- [x] 2.1 Implement `Keep geolocation permission user-triggered` by wiring the prompt accept action to the existing location request flow
- [x] 2.2 Verify `The system handles current location success and failure states` still works when location is triggered from the first-open prompt
- [x] 2.3 Verify `Users can recenter the map around their current location` still works after the prompt-driven location flow succeeds

## 3. Prompt Lifecycle and Verification

- [x] 3.1 Implement `Limit the prompt to first map entry per page session` so the first-open prompt is only shown once per page load
- [x] 3.2 Verify `Users can dismiss the initial location prompt` keeps the current map view active after skip
- [x] 3.3 Add automated verification for the modified `Users can request their current location` and `Users can browse nearby mushroom locations on a map` first-open prompt scenarios

## 4. Remember Last Location and Stabilize Nearby Browsing

- [x] 4.1 Implement `Reuse the last successful location on reload` for `Users can request their current location` before showing the first-open prompt
- [x] 4.2 Implement `Decouple nearby cache reuse from viewport jitter` for `Users can browse nearby mushroom locations on a map` by keeping a nearby dataset keyed to the determined user location and filtering it by the current viewport on the client
- [x] 4.3 Add automated verification for the restored last-known location flow and the reduced API churn during small viewport moves around the same located area

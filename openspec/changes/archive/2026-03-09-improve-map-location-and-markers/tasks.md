## 1. Current Location Request Flow

- [x] 1.1 Implement `Use user-triggered current location requests` by adding UI controls for `Users can request their current location`
- [x] 1.2 Implement browser permission handling for `The system handles current location success and failure states`
- [x] 1.3 Ensure the initial page load keeps existing map behavior until `Users can request their current location` is explicitly triggered

## 2. Current Location Marker and Recenter Behavior

- [x] 2.1 Implement `Show current location with a dedicated location marker` by rendering a distinct marker for the user's position
- [x] 2.2 Implement `Users can recenter the map around their current location` with a locate or recenter action after location is available
- [x] 2.3 Implement `Recenter map queries around the selected user location` so viewport refresh uses the updated map center after a successful recenter action

## 3. Mushroom Marker Visualization

- [x] 3.1 Implement `Render mushroom markers with colored custom icons and legend` by replacing generic markers with colored mushroom icons
- [x] 3.2 Implement `Mushroom locations use colored icon markers` for known and unknown derived state cases
- [x] 3.3 Implement `Marker colors have consistent state meaning` across the map and related UI state presentation
- [x] 3.4 Implement `The map provides marker legend guidance` with a visible legend or equivalent marker explanation

## 4. Map Browsing Integration

- [x] 4.1 Update the modified `Users can browse nearby mushroom locations on a map` requirement to support browsing around the current location after explicit recenter
- [x] 4.2 Verify that current location recenter keeps `The map shows derived mushroom state and freshness` working in the updated viewport
- [x] 4.3 Verify that current location recenter keeps `The map distinguishes predictions from confirmed observations` visible with the new marker presentation

## 5. Fallback and Error Handling

- [x] 5.1 Implement `Preserve graceful fallback when geolocation is unavailable` for denied permission, unsupported browsers, and location lookup failures
- [x] 5.2 Add user-facing messaging for `The system handles current location success and failure states` without blocking standard map browsing
- [x] 5.3 Verify that map browsing continues to function when geolocation is unavailable and `Users can request their current location` does not succeed

## 6. Verification

- [x] 6.1 Add automated verification for `Users can request their current location` and `Users can recenter the map around their current location`
- [x] 6.2 Add automated verification for `Mushroom locations use colored icon markers`, `Marker colors have consistent state meaning`, and `The map provides marker legend guidance`
- [x] 6.3 Add integration verification for the modified `Users can browse nearby mushroom locations on a map` flow with current location recenter
- [x] 6.4 Add fallback verification for `The system handles current location success and failure states` and `Preserve graceful fallback when geolocation is unavailable`

## 7. Source Layering

- [x] 7.1 Implement `Keep a unified map payload with sourceLayer metadata` for `The map distinguishes confirmed and candidate locations`
- [x] 7.2 Implement `Distinguish confirmed and candidate points in the UI` for `The map distinguishes confirmed and candidate locations`
- [x] 7.3 Implement `Users can filter visible map sources` with layer counts, visibility toggles, and last-visible-layer protection
- [x] 7.4 Verify `Reuse existing marker legend and state semantics` keeps source distinctions separate from marker state colors

## 8. Observation Reporting Assistance

- [x] 8.1 Implement `Prefill observation reports from map interactions` for `Selecting a map location prefills observation input`
- [x] 8.2 Implement `Prefill observation reports from map interactions` for `Current location can prefill observation input`
- [x] 8.3 Verify the modified `Users can submit mushroom observations` flow supports selected markers, clicked map coordinates, and current location prefill

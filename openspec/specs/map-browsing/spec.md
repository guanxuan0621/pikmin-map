# map-browsing Specification

## Purpose

TBD - created by archiving change 'add-pikmin-mushroom-map'. Update Purpose after archive.

## Requirements

### Requirement: Users can browse nearby mushroom locations on a map

The system SHALL allow a user to view mushroom locations within the currently selected map area, and SHALL support browsing a map area centered on the user's current location after an explicit location request.

#### Scenario: User opens the mushroom map

- **WHEN** a user opens the mushroom map
- **THEN** the system SHALL display mushroom locations for the default or currently selected map area

#### Scenario: User changes the visible map area

- **WHEN** a user pans or zooms the map to a different area
- **THEN** the system SHALL refresh the displayed mushroom locations for the newly visible area

#### Scenario: User recenters around current location

- **WHEN** a user explicitly requests the current location recenter action and a valid location is available
- **THEN** the system SHALL update the map to browse mushroom locations around the user's current location


<!-- @trace
source: improve-map-location-and-markers
updated: 2026-03-09
code:
  - src/lib/mushrooms/jobs.ts
  - docs/rollout-checklist.md
  - src/lib/mushrooms/overpass.ts
  - src/lib/prisma.ts
  - src/lib/mushrooms/geo.ts
  - src/lib/mushrooms/map-ui.ts
  - next.config.ts
  - .env.example
  - src/lib/mushrooms/types.ts
  - src/components/mushroom-map-client.tsx
  - src/lib/mushrooms/rate-limit.ts
  - src/app/api/mushrooms/route.ts
  - src/lib/mushrooms/repository.ts
  - next-env.d.ts
  - src/app/page.tsx
  - prisma/schema.prisma
  - src/app/api/observations/route.ts
  - scripts/smoke-test.ts
  - src/lib/mushrooms/derive.ts
  - src/lib/mushrooms/fixtures.ts
  - scripts/process-refresh-jobs.ts
  - package.json
  - src/lib/mushrooms/validation.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - tsconfig.json
  - eslint.config.mjs
  - postcss.config.mjs
  - prisma.config.ts
tests:
  - tests/map-ui.test.ts
  - tests/mushroom-domain.test.ts
  - tests/overpass.test.ts
  - tests/geo.test.ts
  - tests/observation-guards.test.ts
-->

---
### Requirement: The map shows derived mushroom state and freshness

The system SHALL display the best known derived state for each mushroom location, including its latest known status and when that state was last updated.

#### Scenario: Derived state exists for a location

- **WHEN** a mushroom location has a derived current state
- **THEN** the system SHALL display the location, current status, and last updated timestamp

#### Scenario: No derived state exists for a location

- **WHEN** a mushroom location has no derived current state
- **THEN** the system SHALL indicate that current status is unavailable


<!-- @trace
source: add-pikmin-mushroom-map
updated: 2026-03-09
code:
  - .env.example
  - src/lib/mushrooms/types.ts
  - scripts/process-refresh-jobs.ts
  - src/app/globals.css
  - src/lib/mushrooms/fixtures.ts
  - next-env.d.ts
  - src/lib/mushrooms/rate-limit.ts
  - src/app/api/observations/route.ts
  - postcss.config.mjs
  - src/app/api/mushrooms/route.ts
  - docs/rollout-checklist.md
  - src/app/layout.tsx
  - eslint.config.mjs
  - src/lib/mushrooms/repository.ts
  - src/app/page.tsx
  - src/lib/mushrooms/derive.ts
  - scripts/smoke-test.ts
  - package.json
  - next.config.ts
  - src/lib/prisma.ts
  - tsconfig.json
  - prisma.config.ts
  - src/lib/mushrooms/geo.ts
  - src/lib/mushrooms/jobs.ts
  - prisma/schema.prisma
  - src/lib/mushrooms/validation.ts
  - src/components/mushroom-map-client.tsx
tests:
  - tests/mushroom-domain.test.ts
  - tests/observation-guards.test.ts
-->

---
### Requirement: The map distinguishes predictions from confirmed observations

The system SHALL present predicted completion time and predicted next spawn time as predictions rather than confirmed facts.

#### Scenario: Prediction data is available

- **WHEN** prediction data exists for a mushroom location
- **THEN** the system SHALL display the predicted completion time, predicted next spawn time, and prediction confidence separately from observed state

#### Scenario: Prediction data is unavailable

- **WHEN** prediction data does not exist for a mushroom location
- **THEN** the system SHALL indicate that prediction data is unavailable without implying a confirmed estimate

<!-- @trace
source: add-pikmin-mushroom-map
updated: 2026-03-09
code:
  - .env.example
  - src/lib/mushrooms/types.ts
  - scripts/process-refresh-jobs.ts
  - src/app/globals.css
  - src/lib/mushrooms/fixtures.ts
  - next-env.d.ts
  - src/lib/mushrooms/rate-limit.ts
  - src/app/api/observations/route.ts
  - postcss.config.mjs
  - src/app/api/mushrooms/route.ts
  - docs/rollout-checklist.md
  - src/app/layout.tsx
  - eslint.config.mjs
  - src/lib/mushrooms/repository.ts
  - src/app/page.tsx
  - src/lib/mushrooms/derive.ts
  - scripts/smoke-test.ts
  - package.json
  - next.config.ts
  - src/lib/prisma.ts
  - tsconfig.json
  - prisma.config.ts
  - src/lib/mushrooms/geo.ts
  - src/lib/mushrooms/jobs.ts
  - prisma/schema.prisma
  - src/lib/mushrooms/validation.ts
  - src/components/mushroom-map-client.tsx
tests:
  - tests/mushroom-domain.test.ts
  - tests/observation-guards.test.ts
-->
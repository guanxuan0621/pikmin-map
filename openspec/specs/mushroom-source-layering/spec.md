# mushroom-source-layering Specification

## Purpose

TBD - created by archiving change 'improve-map-location-and-markers'. Update Purpose after archive.

## Requirements

### Requirement: The map distinguishes confirmed and candidate locations

The system SHALL distinguish player-confirmed mushroom locations from potential candidate locations in both map and list views.

#### Scenario: Mixed location sources are displayed

- **WHEN** the current viewport contains both confirmed mushroom locations and candidate points
- **THEN** the system SHALL preserve the source classification for each item and present enough visual guidance to tell the two sources apart

#### Scenario: Candidate overlaps a confirmed location

- **WHEN** a candidate point overlaps or nearly overlaps a confirmed mushroom location for the same area
- **THEN** the system SHALL prefer the confirmed location in the user-visible result set


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
### Requirement: Users can filter visible map sources

The system SHALL allow users to control the visibility of confirmed and candidate sources without making the map appear unintentionally empty.

#### Scenario: User hides one source type

- **WHEN** a user disables either confirmed locations or candidate points
- **THEN** the system SHALL update both the map markers and the visible location list to reflect the remaining enabled source types

#### Scenario: User attempts to disable the last visible source

- **WHEN** a user tries to disable the only remaining visible source type
- **THEN** the system SHALL keep at least one source visible and display a non-blocking guidance message

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
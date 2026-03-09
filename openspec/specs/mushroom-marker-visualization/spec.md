# mushroom-marker-visualization Specification

## Purpose

TBD - created by archiving change 'improve-map-location-and-markers'. Update Purpose after archive.

## Requirements

### Requirement: Mushroom locations use colored icon markers

The system SHALL display mushroom locations on the map using colored icon markers rather than relying only on generic default map markers.

#### Scenario: Mushroom state is available

- **WHEN** a mushroom location has a known derived state
- **THEN** the system SHALL render that location with a colored mushroom icon marker that reflects its state category

#### Scenario: Mushroom state is unavailable

- **WHEN** a mushroom location does not have a known derived state
- **THEN** the system SHALL render that location with a fallback mushroom marker style that indicates unknown status


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
### Requirement: Marker colors have consistent state meaning

The system SHALL apply a consistent color meaning for mushroom markers across the map experience.

#### Scenario: Active mushroom is shown

- **WHEN** a mushroom location is currently active
- **THEN** the system SHALL render it using the configured active-state marker color

#### Scenario: Defeated or unavailable mushroom is shown

- **WHEN** a mushroom location is defeated or otherwise not currently active
- **THEN** the system SHALL render it using the configured non-active marker color for that state category


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
### Requirement: The map provides marker legend guidance

The system SHALL provide a basic legend or equivalent guidance explaining the meaning of mushroom marker colors.

#### Scenario: User views the map controls or marker guidance area

- **WHEN** a user views the map interface
- **THEN** the system SHALL display marker color guidance for the supported mushroom states

#### Scenario: Marker meaning needs interpretation

- **WHEN** a user encounters colored mushroom markers on the map
- **THEN** the system SHALL provide enough visual guidance to distinguish at least active, defeated, and unknown marker meanings

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
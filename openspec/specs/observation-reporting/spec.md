# observation-reporting Specification

## Purpose

TBD - created by archiving change 'add-pikmin-mushroom-map'. Update Purpose after archive.

## Requirements

### Requirement: Users can submit mushroom observations

The system SHALL allow a user to submit an observation for a mushroom location, including the observation time and the observed mushroom state, and SHALL support prefilling the observation form from map interactions.

#### Scenario: User selects an existing map location before reporting

- **WHEN** a user selects a visible mushroom location from the map or visible list before opening or editing the report form
- **THEN** the system SHALL prefill the observation form with that location's title and coordinates

#### Scenario: User clicks an arbitrary map point before reporting

- **WHEN** a user clicks a point on the map that is not an existing selected mushroom location
- **THEN** the system SHALL prefill the observation form with the clicked coordinates so the user can report a new location


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
### Requirement: Observation input is validated before acceptance

The system SHALL validate required observation fields and SHALL reject observations that are incomplete or invalid.

#### Scenario: Required field is missing

- **WHEN** a user submits an observation without a required field
- **THEN** the system SHALL reject the submission and return a validation error

#### Scenario: Observation timestamp is invalid

- **WHEN** a user submits an observation with an invalid or unparseable observation timestamp
- **THEN** the system SHALL reject the submission and return a validation error


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
### Requirement: Accepted observations return submission feedback

The system SHALL provide submission feedback after processing an observation request.

#### Scenario: Observation is accepted

- **WHEN** a valid observation is successfully stored
- **THEN** the system SHALL return a success response identifying that the observation was accepted

#### Scenario: Observation is rejected

- **WHEN** an observation fails validation or moderation checks
- **THEN** the system SHALL return an error response describing why the submission was not accepted

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
### Requirement: Selecting a map location prefills observation input

The system SHALL provide a direct way to use the currently selected mushroom location as the observation target.

#### Scenario: Selected location quick-fill is requested

- **WHEN** a user invokes the selected-location quick-fill action while a mushroom location is selected
- **THEN** the system SHALL update the observation form coordinates to match that selected location


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
### Requirement: Current location can prefill observation input

The system SHALL provide a direct way to use the user's current location as the observation target when current location data is available.

#### Scenario: Current location quick-fill succeeds

- **WHEN** a user invokes the current-location quick-fill action after a valid current location has been determined
- **THEN** the system SHALL prefill the observation form coordinates with the user's current location

#### Scenario: Current location quick-fill is unavailable

- **WHEN** a user invokes the current-location quick-fill action before a valid current location has been determined
- **THEN** the system SHALL keep the current form values and display a non-blocking guidance message

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
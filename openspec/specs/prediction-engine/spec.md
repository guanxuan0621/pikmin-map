# prediction-engine Specification

## Purpose

TBD - created by archiving change 'add-pikmin-mushroom-map'. Update Purpose after archive.

## Requirements

### Requirement: The system derives a predicted completion time

The system SHALL compute a predicted completion time for a mushroom location when sufficient observation data exists.

#### Scenario: Sufficient data exists for completion prediction

- **WHEN** the system has sufficient observation data for a mushroom location
- **THEN** the system SHALL produce a predicted completion time for that location

#### Scenario: Insufficient data exists for completion prediction

- **WHEN** the system does not have sufficient observation data for a mushroom location
- **THEN** the system SHALL not invent a completion time and SHALL mark the prediction as unavailable


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
### Requirement: The system derives a predicted next spawn time

The system SHALL compute a predicted next spawn time for a mushroom location when sufficient historical data exists.

#### Scenario: Sufficient historical data exists for respawn prediction

- **WHEN** the system has sufficient historical data for a mushroom location
- **THEN** the system SHALL produce a predicted next spawn time for that location

#### Scenario: Insufficient historical data exists for respawn prediction

- **WHEN** the system does not have sufficient historical data for a mushroom location
- **THEN** the system SHALL mark the next spawn prediction as unavailable


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
### Requirement: Predictions include confidence and provenance

The system SHALL attach confidence information to each prediction and SHALL distinguish predictions from direct observations.

#### Scenario: Prediction is returned to a client

- **WHEN** the system returns a prediction for a mushroom location
- **THEN** the prediction SHALL include a confidence value and SHALL be labeled as a prediction

#### Scenario: Prediction is updated after new observations

- **WHEN** new observations materially affect the predicted outcome for a mushroom location
- **THEN** the system SHALL refresh the stored prediction for that location

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
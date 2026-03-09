# Rollout Checklist

## Before Launch

- Ensure `DATABASE_URL` points to the target PostgreSQL instance.
- Run `npm run prisma:generate` after schema changes.
- Run `npm run lint`.
- Run `npm run build`.
- Start the app with `npm run dev` or `npm run start`.

## Background Refresh

- Run `npm run jobs:refresh` to process queued aggregation and prediction refresh work.
- Monitor refresh failures in the `refresh_jobs` table when using the database-backed path.
- Confirm new observations eventually update derived state and prediction records.

## Verification

- Run `npm test` for domain checks around prediction, validation, and rate limiting.
- Run `npm run test:smoke` against a running local server to verify the read/write API flow.
- Verify that locations with insufficient history return `prediction.status = "UNAVAILABLE"`.

## Fallback Behavior

- If prediction refresh is failing, keep the read API online and continue collecting observations.
- If prediction data is missing, the UI shall continue to show derived state with unavailable prediction messaging.
- If the database path is unavailable in local development, the fixture-backed path can still be used for UI and API iteration.

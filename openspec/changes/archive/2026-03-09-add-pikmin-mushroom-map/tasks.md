## 1. Data Model and Query Foundations

- [x] 1.1 Implement `Separate raw observations, derived mushroom state, and predictions` by defining storage models for locations, observations, derived states, and predictions
- [x] 1.2 Implement `Use geospatial storage and area-based map queries` by defining location identity, coordinates, and area-based lookup strategy
- [x] 1.3 Create database access paths for `Users can browse nearby mushroom locations on a map`
- [x] 1.4 Create read models for `The map shows derived mushroom state and freshness`
- [x] 1.5 Create response fields for `The map distinguishes predictions from confirmed observations`

## 2. Read and Write API Flows

- [x] 2.1 Implement `Use map query APIs for reads and a dedicated observation ingestion path for writes` by defining separate read and write endpoints
- [x] 2.2 Build the read API behavior for `Users can browse nearby mushroom locations on a map`
- [x] 2.3 Build the read API behavior for `The map shows derived mushroom state and freshness`
- [x] 2.4 Build the read API behavior for `The map distinguishes predictions from confirmed observations`
- [x] 2.5 Build the write API behavior for `Users can submit mushroom observations`
- [x] 2.6 Build request and response handling for `Accepted observations return submission feedback`

## 3. Observation Validation and Trust Controls

- [x] 3.1 Implement `Validate and rate limit observations before they enter aggregation` with request schema validation and submission guards
- [x] 3.2 Implement request checks for `Observation input is validated before acceptance`
- [x] 3.3 Implement throttling for `Observation submission is rate limited`
- [x] 3.4 Implement conflict marking for `The system handles conflicting observations`
- [x] 3.5 Implement trust checks for `Suspicious observations are flagged`

## 4. Aggregation and Derived State

- [x] 4.1 Implement `Use background jobs for aggregation and prediction refresh` for observation deduplication and state rebuild workflows
- [x] 4.2 Build aggregation logic that updates the derived state required by `The map shows derived mushroom state and freshness`
- [x] 4.3 Build aggregation outputs that preserve the distinction required by `The map distinguishes predictions from confirmed observations`
- [x] 4.4 Verify that accepted and conflicting observations flow correctly from `Users can submit mushroom observations` into aggregation

## 5. Prediction Engine

- [x] 5.1 Implement `Use rule-based prediction heuristics for MVP` for mushroom completion and respawn estimation
- [x] 5.2 Implement prediction generation for `The system derives a predicted completion time`
- [x] 5.3 Implement prediction generation for `The system derives a predicted next spawn time`
- [x] 5.4 Implement output metadata for `Predictions include confidence and provenance`
- [x] 5.5 Connect prediction refresh jobs to `Use background jobs for aggregation and prediction refresh`

## 6. Frontend Map and Reporting Experience

- [x] 6.1 Build map UI flows for `Users can browse nearby mushroom locations on a map`
- [x] 6.2 Build state presentation for `The map shows derived mushroom state and freshness`
- [x] 6.3 Build prediction presentation for `The map distinguishes predictions from confirmed observations`
- [x] 6.4 Build report submission UI for `Users can submit mushroom observations`
- [x] 6.5 Build success and error feedback flows for `Accepted observations return submission feedback`

## 7. Verification and Operational Readiness

- [x] 7.1 Add end-to-end verification for `Users can browse nearby mushroom locations on a map` and `Users can submit mushroom observations`
- [x] 7.2 Add verification for `Observation input is validated before acceptance`, `Observation submission is rate limited`, and `Suspicious observations are flagged`
- [x] 7.3 Add verification for `The system derives a predicted completion time`, `The system derives a predicted next spawn time`, and `Predictions include confidence and provenance`
- [x] 7.4 Add verification for `The system handles conflicting observations` and `The map distinguishes predictions from confirmed observations`
- [x] 7.5 Add rollout checks for background jobs, monitoring, and fallback behavior when predictions are unavailable

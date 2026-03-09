## ADDED Requirements

### Requirement: Observation submission is rate limited

The system SHALL apply rate limits to observation submission in order to reduce abuse and accidental submission floods.

#### Scenario: Submission is within allowed rate limits

- **WHEN** a user submits an observation within the allowed submission rate
- **THEN** the system SHALL continue processing the observation request

#### Scenario: Submission exceeds allowed rate limits

- **WHEN** a user exceeds the allowed observation submission rate
- **THEN** the system SHALL reject the submission and return a rate limit error

### Requirement: The system handles conflicting observations

The system SHALL detect conflicting observations for the same mushroom location and SHALL preserve the raw submissions for later review or aggregation.

#### Scenario: Conflicting observations are received

- **WHEN** two or more observations for the same mushroom location disagree on current state within the same relevant time window
- **THEN** the system SHALL retain the raw observations and mark the location as having conflicting input for aggregation

#### Scenario: Non-conflicting observations are received

- **WHEN** multiple observations for the same mushroom location agree within the same relevant time window
- **THEN** the system SHALL treat those observations as consistent input for aggregation

### Requirement: Suspicious observations are flagged

The system SHALL flag observations that fail trust checks or appear internally inconsistent.

#### Scenario: Observation fails a trust check

- **WHEN** an observation matches a defined suspicious pattern or fails a trust check
- **THEN** the system SHALL flag the observation for moderation or reduced trust during aggregation

#### Scenario: Observation passes trust checks

- **WHEN** an observation passes trust checks
- **THEN** the system SHALL allow the observation to participate in normal aggregation

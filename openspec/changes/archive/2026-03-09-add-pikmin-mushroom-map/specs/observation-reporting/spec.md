## ADDED Requirements

### Requirement: Users can submit mushroom observations

The system SHALL allow a user to submit an observation for a mushroom location, including the observation time and the observed mushroom state.

#### Scenario: User submits a valid observation

- **WHEN** a user submits an observation with all required fields in a valid format
- **THEN** the system SHALL store the observation and associate it with the referenced mushroom location

#### Scenario: User submits an observation for a new location

- **WHEN** a user submits an observation for a mushroom location not yet known to the system
- **THEN** the system SHALL create or register the location before associating the observation with it

### Requirement: Observation input is validated before acceptance

The system SHALL validate required observation fields and SHALL reject observations that are incomplete or invalid.

#### Scenario: Required field is missing

- **WHEN** a user submits an observation without a required field
- **THEN** the system SHALL reject the submission and return a validation error

#### Scenario: Observation timestamp is invalid

- **WHEN** a user submits an observation with an invalid or unparseable observation timestamp
- **THEN** the system SHALL reject the submission and return a validation error

### Requirement: Accepted observations return submission feedback

The system SHALL provide submission feedback after processing an observation request.

#### Scenario: Observation is accepted

- **WHEN** a valid observation is successfully stored
- **THEN** the system SHALL return a success response identifying that the observation was accepted

#### Scenario: Observation is rejected

- **WHEN** an observation fails validation or moderation checks
- **THEN** the system SHALL return an error response describing why the submission was not accepted

## ADDED Requirements

### Requirement: The system derives a predicted completion time

The system SHALL compute a predicted completion time for a mushroom location when sufficient observation data exists.

#### Scenario: Sufficient data exists for completion prediction

- **WHEN** the system has sufficient observation data for a mushroom location
- **THEN** the system SHALL produce a predicted completion time for that location

#### Scenario: Insufficient data exists for completion prediction

- **WHEN** the system does not have sufficient observation data for a mushroom location
- **THEN** the system SHALL not invent a completion time and SHALL mark the prediction as unavailable

### Requirement: The system derives a predicted next spawn time

The system SHALL compute a predicted next spawn time for a mushroom location when sufficient historical data exists.

#### Scenario: Sufficient historical data exists for respawn prediction

- **WHEN** the system has sufficient historical data for a mushroom location
- **THEN** the system SHALL produce a predicted next spawn time for that location

#### Scenario: Insufficient historical data exists for respawn prediction

- **WHEN** the system does not have sufficient historical data for a mushroom location
- **THEN** the system SHALL mark the next spawn prediction as unavailable

### Requirement: Predictions include confidence and provenance

The system SHALL attach confidence information to each prediction and SHALL distinguish predictions from direct observations.

#### Scenario: Prediction is returned to a client

- **WHEN** the system returns a prediction for a mushroom location
- **THEN** the prediction SHALL include a confidence value and SHALL be labeled as a prediction

#### Scenario: Prediction is updated after new observations

- **WHEN** new observations materially affect the predicted outcome for a mushroom location
- **THEN** the system SHALL refresh the stored prediction for that location

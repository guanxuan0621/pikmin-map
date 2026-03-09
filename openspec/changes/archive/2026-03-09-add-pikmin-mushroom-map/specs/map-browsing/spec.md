## ADDED Requirements

### Requirement: Users can browse nearby mushroom locations on a map

The system SHALL allow a user to view mushroom locations within the currently selected map area.

#### Scenario: User opens the mushroom map

- **WHEN** a user opens the mushroom map
- **THEN** the system SHALL display mushroom locations for the default or currently selected map area

#### Scenario: User changes the visible map area

- **WHEN** a user pans or zooms the map to a different area
- **THEN** the system SHALL refresh the displayed mushroom locations for the newly visible area

### Requirement: The map shows derived mushroom state and freshness

The system SHALL display the best known derived state for each mushroom location, including its latest known status and when that state was last updated.

#### Scenario: Derived state exists for a location

- **WHEN** a mushroom location has a derived current state
- **THEN** the system SHALL display the location, current status, and last updated timestamp

#### Scenario: No derived state exists for a location

- **WHEN** a mushroom location has no derived current state
- **THEN** the system SHALL indicate that current status is unavailable

### Requirement: The map distinguishes predictions from confirmed observations

The system SHALL present predicted completion time and predicted next spawn time as predictions rather than confirmed facts.

#### Scenario: Prediction data is available

- **WHEN** prediction data exists for a mushroom location
- **THEN** the system SHALL display the predicted completion time, predicted next spawn time, and prediction confidence separately from observed state

#### Scenario: Prediction data is unavailable

- **WHEN** prediction data does not exist for a mushroom location
- **THEN** the system SHALL indicate that prediction data is unavailable without implying a confirmed estimate

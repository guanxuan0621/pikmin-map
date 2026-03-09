## ADDED Requirements

### Requirement: Mushroom locations use colored icon markers

The system SHALL display mushroom locations on the map using colored icon markers rather than relying only on generic default map markers.

#### Scenario: Mushroom state is available

- **WHEN** a mushroom location has a known derived state
- **THEN** the system SHALL render that location with a colored mushroom icon marker that reflects its state category

#### Scenario: Mushroom state is unavailable

- **WHEN** a mushroom location does not have a known derived state
- **THEN** the system SHALL render that location with a fallback mushroom marker style that indicates unknown status

### Requirement: Marker colors have consistent state meaning

The system SHALL apply a consistent color meaning for mushroom markers across the map experience.

#### Scenario: Active mushroom is shown

- **WHEN** a mushroom location is currently active
- **THEN** the system SHALL render it using the configured active-state marker color

#### Scenario: Defeated or unavailable mushroom is shown

- **WHEN** a mushroom location is defeated or otherwise not currently active
- **THEN** the system SHALL render it using the configured non-active marker color for that state category

### Requirement: The map provides marker legend guidance

The system SHALL provide a basic legend or equivalent guidance explaining the meaning of mushroom marker colors.

#### Scenario: User views the map controls or marker guidance area

- **WHEN** a user views the map interface
- **THEN** the system SHALL display marker color guidance for the supported mushroom states

#### Scenario: Marker meaning needs interpretation

- **WHEN** a user encounters colored mushroom markers on the map
- **THEN** the system SHALL provide enough visual guidance to distinguish at least active, defeated, and unknown marker meanings

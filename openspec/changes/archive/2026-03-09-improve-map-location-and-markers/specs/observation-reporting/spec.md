## MODIFIED Requirements

### Requirement: Users can submit mushroom observations

The system SHALL allow a user to submit an observation for a mushroom location, including the observation time and the observed mushroom state, and SHALL support prefilling the observation form from map interactions.

#### Scenario: User selects an existing map location before reporting

- **WHEN** a user selects a visible mushroom location from the map or visible list before opening or editing the report form
- **THEN** the system SHALL prefill the observation form with that location's title and coordinates

#### Scenario: User clicks an arbitrary map point before reporting

- **WHEN** a user clicks a point on the map that is not an existing selected mushroom location
- **THEN** the system SHALL prefill the observation form with the clicked coordinates so the user can report a new location

## ADDED Requirements

### Requirement: Selecting a map location prefills observation input

The system SHALL provide a direct way to use the currently selected mushroom location as the observation target.

#### Scenario: Selected location quick-fill is requested

- **WHEN** a user invokes the selected-location quick-fill action while a mushroom location is selected
- **THEN** the system SHALL update the observation form coordinates to match that selected location

### Requirement: Current location can prefill observation input

The system SHALL provide a direct way to use the user's current location as the observation target when current location data is available.

#### Scenario: Current location quick-fill succeeds

- **WHEN** a user invokes the current-location quick-fill action after a valid current location has been determined
- **THEN** the system SHALL prefill the observation form coordinates with the user's current location

#### Scenario: Current location quick-fill is unavailable

- **WHEN** a user invokes the current-location quick-fill action before a valid current location has been determined
- **THEN** the system SHALL keep the current form values and display a non-blocking guidance message

## ADDED Requirements

### Requirement: Users can request their current location

The system SHALL allow a user to explicitly request their current location from the map interface.

#### Scenario: User chooses to locate themselves

- **WHEN** a user activates the current location control
- **THEN** the system SHALL request the user's current location from the browser geolocation API

#### Scenario: User has not activated current location

- **WHEN** a user opens the map for the first time
- **THEN** the system SHALL NOT automatically request geolocation permission before the user triggers the current location control

### Requirement: The system handles current location success and failure states

The system SHALL display a clear result when the current location request succeeds, is denied, or fails.

#### Scenario: Current location request succeeds

- **WHEN** the browser returns a valid current location
- **THEN** the system SHALL store the location result for the current map session and display the user's location on the map

#### Scenario: Current location permission is denied

- **WHEN** the browser geolocation request is denied
- **THEN** the system SHALL keep the existing map view and display a non-blocking error or guidance message

#### Scenario: Current location request fails

- **WHEN** the browser geolocation request fails for any reason other than permission denial
- **THEN** the system SHALL keep the existing map view and display a non-blocking error message

### Requirement: Users can recenter the map around their current location

The system SHALL allow the map to recenter around the user's current location after a successful current location request.

#### Scenario: Current location is available

- **WHEN** a user's current location has been successfully determined
- **THEN** the system SHALL provide a way to center the map on that location

#### Scenario: Map recenters around current location

- **WHEN** the user invokes the current location recenter action after location is available
- **THEN** the system SHALL move the map viewport to the user's current location and refresh nearby mushroom results for the new viewport

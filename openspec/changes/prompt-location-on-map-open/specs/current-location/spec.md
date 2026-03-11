## MODIFIED Requirements

### Requirement: Users can request their current location

The system SHALL allow a user to explicitly request their current location from the map interface, including from an in-app prompt shown when the map first opens.

#### Scenario: User chooses to locate themselves

- **WHEN** a user activates the current location control
- **THEN** the system SHALL request the user's current location from the browser geolocation API

#### Scenario: User is prompted on first map open

- **WHEN** a user opens the map for the first time in a page session and no current location has been determined yet
- **THEN** the system SHALL display a non-blocking in-app prompt asking whether to locate the user's current position

#### Scenario: User has not accepted the initial location prompt

- **WHEN** a user opens the map for the first time and has not accepted the in-app location prompt
- **THEN** the system SHALL NOT automatically request browser geolocation permission before the user explicitly accepts the prompt or activates the current location control

#### Scenario: User revisits after a previous successful location

- **GIVEN** the browser still has a recent successful current-location result from an earlier visit
- **WHEN** the user reloads or reopens the map
- **THEN** the system SHALL initialize the map from that last successful location without automatically requesting browser geolocation permission again

## ADDED Requirements

### Requirement: Users can dismiss the initial location prompt

The system SHALL allow a user to dismiss or skip the initial location prompt without blocking access to the map.

#### Scenario: User skips location on first open

- **WHEN** a user dismisses or declines the initial location prompt
- **THEN** the system SHALL keep the current map view and continue to allow manual browsing without requesting geolocation permission

#### Scenario: Initial prompt has already been handled

- **WHEN** a user has already accepted or dismissed the initial location prompt during the current page session
- **THEN** the system SHALL NOT show the same initial prompt again unless the map page is reloaded

#### Scenario: Stored successful location exists on reload

- **GIVEN** the browser still has a recent successful current-location result from an earlier visit
- **WHEN** the map finishes initializing
- **THEN** the system SHALL skip the first-open location prompt and keep the current location controls available for manual refresh or recentering

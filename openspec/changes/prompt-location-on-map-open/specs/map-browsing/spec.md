## MODIFIED Requirements

### Requirement: Users can browse nearby mushroom locations on a map

The system SHALL allow a user to view mushroom locations within the currently selected map area, SHALL support browsing a map area centered on the user's current location after an explicit location request, and SHALL provide a first-open prompt that offers location-based browsing without blocking manual map use.

#### Scenario: User opens the mushroom map

- **WHEN** a user opens the mushroom map
- **THEN** the system SHALL display mushroom locations for the default or currently selected map area

#### Scenario: User sees first-open location prompt

- **WHEN** a user opens the mushroom map for the first time in a page session before choosing whether to locate themselves
- **THEN** the system SHALL display an in-app prompt that offers to center the map around the user's current location

#### Scenario: User changes the visible map area

- **WHEN** a user pans or zooms the map to a different area
- **THEN** the system SHALL refresh the displayed mushroom locations for the newly visible area

#### Scenario: User recenters around current location

- **WHEN** a user explicitly requests the current location recenter action and a valid location is available
- **THEN** the system SHALL update the map to browse mushroom locations around the user's current location

#### Scenario: User revisits from a remembered location

- **GIVEN** the browser still has a recent successful current-location result from an earlier visit
- **WHEN** the user opens the mushroom map again
- **THEN** the system SHALL start browsing from that remembered location instead of the default map area

#### Scenario: User makes a small map move around the same located area

- **GIVEN** the system already has cached nearby mushroom data for the user's determined location
- **WHEN** the user makes a small pan or zoom change while staying in that same nearby area
- **THEN** the system SHALL reuse the cached nearby dataset and update the visible mushrooms for the current viewport without requiring a new nearby data request

#### Scenario: User skips first-open location prompt

- **WHEN** a user dismisses the first-open location prompt
- **THEN** the system SHALL keep the current map area visible and continue supporting standard map browsing interactions

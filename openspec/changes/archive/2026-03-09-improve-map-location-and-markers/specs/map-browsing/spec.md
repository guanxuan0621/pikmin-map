## MODIFIED Requirements

### Requirement: Users can browse nearby mushroom locations on a map

The system SHALL allow a user to view mushroom locations within the currently selected map area, and SHALL support browsing a map area centered on the user's current location after an explicit location request.

#### Scenario: User opens the mushroom map

- **WHEN** a user opens the mushroom map
- **THEN** the system SHALL display mushroom locations for the default or currently selected map area

#### Scenario: User changes the visible map area

- **WHEN** a user pans or zooms the map to a different area
- **THEN** the system SHALL refresh the displayed mushroom locations for the newly visible area

#### Scenario: User recenters around current location

- **WHEN** a user explicitly requests the current location recenter action and a valid location is available
- **THEN** the system SHALL update the map to browse mushroom locations around the user's current location

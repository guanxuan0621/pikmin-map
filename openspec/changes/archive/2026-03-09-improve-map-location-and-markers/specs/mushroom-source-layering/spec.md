## ADDED Requirements

### Requirement: The map distinguishes confirmed and candidate locations

The system SHALL distinguish player-confirmed mushroom locations from potential candidate locations in both map and list views.

#### Scenario: Mixed location sources are displayed

- **WHEN** the current viewport contains both confirmed mushroom locations and candidate points
- **THEN** the system SHALL preserve the source classification for each item and present enough visual guidance to tell the two sources apart

#### Scenario: Candidate overlaps a confirmed location

- **WHEN** a candidate point overlaps or nearly overlaps a confirmed mushroom location for the same area
- **THEN** the system SHALL prefer the confirmed location in the user-visible result set

### Requirement: Users can filter visible map sources

The system SHALL allow users to control the visibility of confirmed and candidate sources without making the map appear unintentionally empty.

#### Scenario: User hides one source type

- **WHEN** a user disables either confirmed locations or candidate points
- **THEN** the system SHALL update both the map markers and the visible location list to reflect the remaining enabled source types

#### Scenario: User attempts to disable the last visible source

- **WHEN** a user tries to disable the only remaining visible source type
- **THEN** the system SHALL keep at least one source visible and display a non-blocking guidance message

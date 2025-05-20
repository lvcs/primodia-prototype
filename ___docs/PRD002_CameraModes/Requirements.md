# Camera Modes Requirements

## Overview
The game features two main camera views: **Globe** and **Tile**. These modes provide different perspectives and interactions for the player.

## Functional Requirements

- **Default Camera Zoom**
  - Each view (Globe, Tile) has its own defined default camera zoom level.

- **Camera State Persistence**
  - The camera's view, position, and attributes are persisted in the UI store.
  - Switching between views restores the last-used camera state for that view.

- **View Switching UI**
  - A globe icon is displayed next to the user name in the UI.
  - Clicking the globe icon switches the camera to the Globe view.
  - Clicking on the tile switches the camera to the Tile view.
  - When switching to the globe view, keep the camera position's direction the same, but only change its distance from the center (0,0,0).
  - The camera should always look at (0,0,0) and never focus on a tile or any other point except the origin.

- **Configuration-Driven Views**
  - Available views (Globe, Tile, etc.) are defined in a configuration file.
  - Each view's default parameters (zoom, position, etc.) are specified in this configuration.

## Non-Functional Requirements

- Camera transitions between views should be smooth and visually appealing. Those animations should be defined in configuration file
- The UI store should only persist camera state relevant to the current session (ephemeral, not game state).
- The configuration file should be easy to extend for future camera modes or parameters.

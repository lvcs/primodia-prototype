# PLAN: Planet Realistic Size & Units

## Potential Solutions

### Solution 1: Use Real-World Kilometers as World Units
- **Description:** 1 unit in the 3D engine = 1 km in real world.
- **Pros:**
  - Direct mapping between game world and real-world measurements.
  - Simplifies calculations for camera, tile area, and distances.
  - Easy to communicate and reason about scale.
- **Cons:**
  - Large numbers may cause floating-point precision issues at extreme distances.
  - May require scaling down for rendering performance or engine limitations.

### Solution 2: Use Scaled-Down Units (e.g., 1 unit = 10 km)
- **Description:** 1 unit in the 3D engine = 10 km in real world.
- **Pros:**
  - Reduces the range of coordinates, minimizing floating-point errors.
  - Easier to fit the entire planet in a manageable coordinate space.
- **Cons:**
  - Requires conversion between game logic and rendering units.
  - Less intuitive for direct measurement and calculations.

### Solution 3: Use Engine-Native Units with Metadata for Real-World Mapping
- **Description:** Use arbitrary engine units, but store real-world size as metadata for calculations.
- **Pros:**
  - Maximum flexibility for rendering and engine constraints.
  - Can optimize for performance without affecting game logic.
- **Cons:**
  - Adds complexity to all calculations (must always convert between units).
  - Potential for bugs if conversions are missed or inconsistent.

## Decision

**Chosen Solution:** Solution 1: Use Real-World Kilometers as World Units

**Rationale:**
- Direct mapping between game world and real-world measurements aligns with the objective of realism and simplifies calculations for camera and tile area.
- While floating-point precision is a concern, the scale of the planet (radius 6400 km) is within the range where modern 3D engines can handle calculations accurately, especially near the origin (0,0,0).
- This approach is the most intuitive for both development and gameplay design.

## Implementation TODO

1. Refactor planet generation logic to use 1 unit = 1 km (radius = 6400 units).
2. Update camera system to position and move in kilometers from (0,0,0).
3. Adjust tile/grid system to calculate area and positions in km².
4. Audit all existing code for hardcoded units or assumptions about scale; update to use km where appropriate.
5. (Optional) Add utility functions for converting between km and meters if sub-kilometer detail is needed for rendering or physics; otherwise, keep all core logic in kilometers.
6. Update documentation and comments to clarify new unit conventions.
7. Test for floating-point precision issues at large distances and implement mitigations if necessary.

## Implementation Notes & Issues

### Camera Far Plane Clipping Issue
- **Problem:** After scaling the planet to 6400 km, the camera's far clipping plane (CAMERA_FAR_PLANE) was set to 1000, causing the planet and glow to be clipped when zooming out beyond ~7400 units.
- **Solution:** Increased CAMERA_FAR_PLANE to 100,000 in gameConfig.js, allowing the camera to zoom out far enough to view the entire planet and its glow without obstruction. 
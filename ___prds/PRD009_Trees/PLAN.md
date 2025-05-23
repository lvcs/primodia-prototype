# PRD009 - Trees Feature Implementation Plan

## Overview
Simple implementation plan for adding basic visual trees to wood/forest tiles. This is a low-priority visual enhancement that should be implemented quickly and simply.

## Phase 1: Basic Configuration
**Goal**: Set up minimal configuration for trees.

### Tasks:
1. **Simple Tree Config**
   - [ ] Add basic tree constants to existing config file
   - [ ] Define tree count range, based on the Tile size
   - [ ] Define size variation (±20%)
   - [ ] Define basic colors (brown trunk, green canopy)

**Dependencies**: None  
**Estimated Time**: 30 minutes

## Phase 2: Tree Rendering Component
**Goal**: Create simple tree geometry and rendering.

### Tasks:
1. **Basic Tree Mesh**
   - [ ] Create simple tree component in `client/src/game/world/`
   - [ ] Generate cylinder for trunk
   - [ ] Generate cone for canopy
   - [ ] Apply basic materials
   - [ ] Add simple randomization (height, radius, rotation)

2. **Instancing Setup**
   - [ ] Use Three.js instancing for performance
   - [ ] Create instance buffer for tree positions/scales

**Dependencies**: Phase 1  
**Estimated Time**: 3 hours

## Phase 3: Tile Integration
**Goal**: Add trees to wood/forest tiles.

### Tasks:
1. **Tile Detection & Placement**
   - [ ] Identify wood/forest tiles during rendering
   - [ ] Generate random positions within tile boundaries
   - [ ] Create 3-5 trees per wood tile
   - [ ] Add basic spacing to avoid obvious overlaps

2. **Scene Integration**
   - [ ] Add trees to scene when tiles are rendered
   - [ ] Remove trees when tiles are disposed
   - [ ] Basic performance optimization

**Dependencies**: Phase 2  
**Estimated Time**: 2 hours

## Phase 4: Polish
**Goal**: Basic testing and minor adjustments.

### Tasks:
1. **Visual Testing**
   - [ ] Test with different tile sizes
   - [ ] Adjust tree count/spacing if needed
   - [ ] Verify trees stay within boundaries

2. **Performance Check**
   - [ ] Ensure no frame drops
   - [ ] Verify memory cleanup

**Dependencies**: Phase 3  
**Estimated Time**: 1 hour

## File Structure

```
client/src/
├── config/
│   └── [existing config file]      # Add tree constants
└── game/
    └── world/
        └── TreeComponent.js        # Simple tree rendering
```

## Success Criteria
- [ ] Trees appear on wood/forest tiles
- [ ] Basic visual variety (size, rotation)
- [ ] No performance issues
- [ ] Simple, maintainable code

## Total Estimated Time: 6.5 hours (~1 day)

## Implementation Notes
- Keep it simple - this is just visual polish
- Use Math.random() - no need for seeded generation
- Basic geometry instancing for performance
- Minimal configuration needed
- Focus on "good enough" rather than perfect

## Next Steps
1. Start with Phase 1 - add basic config constants
2. Create simple tree component
3. Integrate with tile rendering
4. Test and adjust as needed

# Planet Refactor Ideas

## Current Structure Analysis

### 1. File Organization Problems
- **Tree system mixed with world generation**: Tree.js (505 lines) is in the world folder but should be separate
- **Monolithic files**: 
  - platesGenerator.js (503 lines) - handles all plate tectonics
  - worldGenerator.js (320 lines) - orchestrates everything
  - planetVoronoi.js (682 lines) - geometry + terrain + rendering
- **Unclear separation**: game.js, setup.js, mainLoop.js have overlapping responsibilities

### 2. Architecture Issues
- **Store inconsistency**: Direct manipulation of planetSettings object instead of using stores
- **Tight coupling**: World generation, rendering, and game logic are intertwined
- **Side effects**: RandomService state, global planetSettings mutations
- **Mixed concerns**: Geometry generation includes terrain classification, color calculation, and rendering

### 3. Not Following General Principles
- **Functions too long**: Many functions exceed 50 lines
- **Mixed abstraction levels**: Low-level math mixed with high-level game logic
- **Hardcoded values**: Constants scattered throughout code instead of config
- **Poor modularity**: Can't easily test or reuse components

## Proposed Refactoring Plan

## Phase 1: Complete Store Integration (High Priority)

### 1.1 Remove Global State Dependencies
**Current Issue**: `planetSettings` object in `planetVoronoi.js` is still being used as global state

**Solution**: 
```javascript
// stores/worldStore.js
export const useWorldStore = create((set, get) => ({
  // Generation parameters
  numTiles: DEFAULT_NUMBER_OF_PLANET_TILES,
  jitter: DEFAULT_JITTER,
  algorithm: 'fibonacci1',
  mapType: 'continents',
  numPlates: DEFAULT_TECHTONIC_PLATES,
  
  // View parameters
  viewMode: 'terrain',
  outlineVisible: true,
  elevationBias: 0,
  
  // Generation stages (for step-by-step viewing)
  currentStage: 'terrain', 'geometry', 'plates', 
  'elevation-1', 'elevation-2', 'climate', 'terrain'
  availableStages: [],
  stageData: {}, // Cached data for each stage
  
  // Actions
  setGenerationParams: (params) => set(params),
  setViewParams: (params) => set(params),
  setCurrentStage: (stage) => set({ currentStage: stage }),
}));



// world/planetVoronoi.js - Remove this global object
// export const planetSettings = { ... }

// Instead, always get settings from store:
import { useWorldStore } from '@stores';

export function generatePlanetGeometryGroup(config) {
  // Get settings from store instead of global object
  const settings = useWorldStore.getState();
  const N = settings.numPoints;
  const jitter = settings.jitter;
  // ... etc
}
```

#### 2.2 Remove Global State
- Eliminate direct planetSettings mutations
- Move all settings to stores
- Store-driven reactive updates
- Use store subscriptions for reactive updates

#### 2.3 Reactive Rendering with Store
```javascript
// stores/worldStore.js - Add renderer reference
export const useWorldStore = create((set, get) => ({
  // ... existing state ...
  planetRenderer: null,
  
  setPlanetRenderer: (renderer) => set({ planetRenderer: renderer }),
  
  // Reactive view mode changes
  setViewMode: (viewMode) => {
    set({ viewMode });
    const renderer = get().planetRenderer;
    if (renderer) {
      renderer.updateColors(viewMode); // Direct update, no manual trigger needed
    }
  },
  
  toggleOutlines: () => {
    const current = get().outlineVisible;
    const newValue = !current;
    set({ outlineVisible: newValue });
    const renderer = get().planetRenderer;
    if (renderer) {
      renderer.toggleOutlines(newValue);
    }
  },
  
  toggleTrees: () => {
    const current = get().treesVisible;
    const newValue = !current;
    set({ treesVisible: newValue });
    const renderer = get().planetRenderer;
    if (renderer) {
      renderer.toggleTrees(newValue);
    }
  }
}));
```

### Phase 3: Functional Generation Pipeline

#### 3.1 Staged Generation Pipeline
```javascript
// game/planet/planetPipeline.js
export async function generatePlanetStaged(seed, config, options = {}) {
  const { saveStages = false, tectonicRuns = 3 } = options;
  RandomService.initialize(seed);
  
  const stages = {};
  
  // Stage 1: Base geometry
  const geometry = await generateGeometry(config);
  if (saveStages) stages.geometry = { geometry };
  
  // Stage 2: Tectonic plates
  const plates = await generatePlates(geometry, config.numPlates);
  if (saveStages) stages.plates = { geometry, plates };
  
  // Stage 3-N: Tectonic evolution
  let elevations = null;
  for (let run = 1; run <= tectonicRuns; run++) {
    elevations = await simulateTectonics(geometry, plates, elevations, run);
    if (saveStages) stages[`elevation-${run}`] = { geometry, plates, elevations, run };
  }
  
  // Stage N+1: Climate
  const climate = await generateClimate(geometry, elevations);
  if (saveStages) stages.climate = { geometry, plates, elevations, climate };
  
  // Stage N+2: Final terrain
  const terrain = await classifyTerrain(geometry, elevations, climate);
  const final = { geometry, plates, elevations, climate, terrain, seed };
  

}
```

### 2.2 Incremental Renderer
**Current**: Full regeneration on view changes
**Improved**: Cached geometry with color-only updates

```javascript
// world/planet/planetRenderer.js
export function createPlanetRenderer(planetData) {
  let baseMesh = null;
  let outlineMesh = null;
  let treeMeshes = null;
  const meshGroup = new THREE.Group();
  
  // Build base planet mesh once
  function ensureBaseMesh() {
    if (!baseMesh) {
      baseMesh = buildPlanetMesh(planetData.geometry);
      meshGroup.add(baseMesh);
    }
    return baseMesh;
  }
  
  updateColors(viewMode) {
    if (!this.baseMesh) return;
    
    const colors = this.calculateColors(viewMode);
    this.baseMesh.geometry.setAttribute('color', colors);
    this.baseMesh.geometry.attributes.color.needsUpdate = true;
  }
  
  toggleOutlines(visible) {
    if (visible && !this.outlineMesh) {
      this.outlineMesh = this.createOutlineMesh();
      this.meshGroup.add(this.outlineMesh);
    } else if (!visible && this.outlineMesh) {
      this.meshGroup.remove(this.outlineMesh);
      this.disposeOutlines();
    }
  }
  
  return {
    meshGroup,
    updateColors,
    toggleOutlines,
    toggleTrees,
    dispose: () => {
      // Clean up all resources
      if (baseMesh) {
        baseMesh.geometry.dispose();
        baseMesh.material.dispose();
      }
      if (outlineMesh) {
        outlineMesh.geometry.dispose();
        outlineMesh.material.dispose();
      }
      if (treeMeshes) {
        disposeTrees(treeMeshes);
      }
    }
  };
}

// Usage in game code:
export function renderPlanet(planetData, viewOptions) {
  const renderer = createPlanetRenderer(planetData);
  
  // Apply initial view options
  renderer.updateColors(viewOptions.viewMode);
  renderer.toggleOutlines(viewOptions.outlineVisible);
  renderer.toggleTrees(viewOptions.treesVisible);
  
  return renderer;
}
```

## Phase 3: Enhanced Store Features (Low Priority)

### 3.1 Stage Navigation Store
```javascript
// stores/worldStore.js - Add stage viewing
export const useWorldStore = create((set, get) => ({
  // ... existing state ...
  
  // Stage viewing
  currentStage: 'terrain',
  availableStages: [],
  stageData: {},
  
  setCurrentStage: (stage) => {
    set({ currentStage: stage });
    const renderer = get().planetRenderer;
    const data = get().stageData[stage];
    if (renderer && data) {
      renderer.renderStage(data);
    }
  },
  
  setStageData: (stages) => {
    set({ 
      stageData: stages,
      availableStages: Object.keys(stages)
    });
  },
}));
```

### 3.2 Performance Monitoring
```javascript
// stores/debugStore.js - Add performance metrics
export const useDebugStore = create((set) => ({
  // ... existing state ...
  
  performanceMetrics: {
    lastGenerationTime: 0,
    triangleCount: 0,
    treeCount: 0,
    memoryUsage: 0,
  },
  
  setPerformanceMetrics: (metrics) => set({ performanceMetrics: metrics }),
}));
```

## Phase 4: File Organization Improvements

### 4.1 Move Tree System
**Current**: `game/world/Tree.js` (505 lines)
**Improved**: Dedicated tree module

```
client/src/game/tree/
├── TreeSystem.js         # Main tree system class
├── TreeRenderer.js       # Instanced rendering
├── TreeDistribution.js   # Placement algorithms
├── TreeConfig.js         # Tree constants
└── index.js             # Public API
```

### 4.2 Split Large Files
**Current**: `planetVoronoi.js` (682 lines)
**Improved**: Focused modules

```
client/src/game/planet/
├── voronoiGenerator.js   # Voronoi tessellation
├── delaunayGenerator.js  # Delaunay triangulation
├── geometryUtils.js      # Shared utilities
└── index.js

client/src/game/world/terrain/
├── terrainClassifier.js  # Terrain classification logic
├── colorMapper.js        # Color calculation
└── index.js
```

### 4.3 Consolidate Registries
**Current**: Scattered in `world/registries/`
**Improved**: Centralized with better organization

```
client/src/game/world/registries/
├── index.js              # Export all registries
├── TerrainRegistry.js    # ✅ Already good
├── TemperatureRegistry.js # ✅ Already good  
├── MoistureRegistry.js   # ✅ Already good
├── MapTypeRegistry.js    # ✅ Already good
└── ResourceRegistry.js   # ✅ Already good
```

## Implementation Priority

### Week 1-2: Store Integration (Critical)
1. Remove `planetSettings` global object
2. Make all generation functions use store state
3. Implement reactive rendering via store

### Week 3-4: Performance Optimizations
1. Implement incremental renderer
2. Add stage caching system
3. Optimize tree system integration

### Week 5-6: File Organization
1. Extract tree system to dedicated module
2. Split large files into focused modules
3. Add comprehensive testing

## Benefits of Current + Planned Structure

### ✅ Already Achieved
- **Clean State Management**: Zustand stores provide excellent separation
- **Reactive UI**: Store changes automatically trigger UI updates
- **Modular Architecture**: Good separation between game systems
- **Type Safety**: PropTypes validation in UI components
- **Performance**: Instanced tree rendering already implemented

### 🎯 Additional Benefits from Refactoring
- **Predictable Updates**: Store-driven rendering eliminates manual triggers
- **Better Testing**: Pure functions easier to test in isolation
- **Faster Iteration**: Cached stages allow quick view mode switching
- **Memory Efficiency**: Incremental updates reduce garbage collection
- **Developer Experience**: Clear data flow and debugging capabilities

## Migration Strategy

1. **Gradual Migration**: Keep existing code working while adding new systems
2. **Feature Flags**: Use store flags to switch between old/new rendering
3. **Backwards Compatibility**: Maintain existing APIs during transition
4. **Validation**: Compare outputs between old and new systems
5. **Performance Testing**: Measure improvements at each step

This refactoring builds on your excellent foundation and focuses on the remaining pain points while preserving the good architectural decisions you've already made.

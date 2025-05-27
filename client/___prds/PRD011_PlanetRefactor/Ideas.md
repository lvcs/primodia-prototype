# Planet Refactor Ideas

## Current Issues Analysis

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

### Phase 1: Organize by Game Objects

#### 1.1 Extract Tree Module
```
client/src/game/tree/
├── treeGenerator.js      # Tree placement and generation
├── treeRenderer.js       # Instanced rendering logic
├── treeConfig.js         # Tree-related constants
└── index.js             # Public API
```

#### 1.2 Reorganize World Structure
```
client/src/game/world/
├── planet/
│   ├── planetGenerator.js    # Main planet orchestrator
│   ├── planetGeometry.js     # Voronoi/Delaunay geometry
│   ├── planetRenderer.js     # Mesh creation and colors
│   └── planetConfig.js       # Planet constants
├── plate/
│   ├── plateGenerator.js     # Tectonic plates logic
│   └── plateConfig.js        # Plate constants
├── terrain/
│   ├── terrainGenerator.js   # Terrain classification
│   └── terrainConfig.js      # Terrain constants
├── climate/
│   ├── climateGenerator.js   # Temperature/moisture
│   └── climateConfig.js      # Climate constants
└── model/
    └── [existing models]
```

#### 1.3 Simplify Core Structure
```
client/src/game/core/
├── gameLoop.js          # Main game loop
├── sceneSetup.js        # Three.js scene initialization
└── eventHandlers.js     # Input and event handling
```

### Phase 2: Implement Proper State Management

#### 2.1 Create Dedicated Stores
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
  currentStage: 'terrain', // 'geometry', 'plates', 'elevation-1', 'elevation-2', 'climate', 'terrain'
  availableStages: [],
  stageData: {}, // Cached data for each stage
  
  // Actions
  setGenerationParams: (params) => set(params),
  setViewParams: (params) => set(params),
  setCurrentStage: (stage) => set({ currentStage: stage }),
}));
```

#### 2.2 Remove Global State
- Eliminate direct planetSettings mutations
- Move all settings to worldStore
- Use store subscriptions for reactive updates

#### 2.3 Reactive Rendering with Store
```javascript
// stores/worldStore.js
export const useWorldStore = create((set, get) => ({
  // ... existing state ...
  
  // Renderer instance (cached)
  planetRenderer: null,
  
  // Actions
  setPlanetRenderer: (renderer) => set({ planetRenderer: renderer }),
  
  // Reactive updates
  updateViewMode: (viewMode) => {
    set({ viewMode });
    const renderer = get().planetRenderer;
    if (renderer) {
      renderer.updateColors(viewMode);
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
// world/planet/planetGenerator.js
export async function generatePlanetStaged(seed, config, options = {}) {
  const { saveStages = false, tectonicRuns = 3 } = options;
  RandomService.initialize(seed);
  
  const stages = {};
  
  // Stage 1: Base geometry
  const geometry = await generateGeometry(config);
  if (saveStages) stages.geometry = { geometry };
  
  // Stage 2: Initial plates
  const plates = await generatePlates(geometry, config.numPlates);
  if (saveStages) stages.plates = { geometry, plates };
  
  // Stage 3-N: Tectonic evolution (multiple runs)
  let currentElevations = null;
  for (let run = 1; run <= tectonicRuns; run++) {
    currentElevations = await simulateTectonicMovement(geometry, plates, currentElevations, run);
    if (saveStages) {
      stages[`elevation-${run}`] = { 
        geometry, 
        plates, 
        elevations: currentElevations,
        tectonicRun: run 
      };
    }
  }
  
  // Stage N+1: Climate generation
  const climate = await generateClimate(geometry, currentElevations);
  if (saveStages) stages.climate = { geometry, plates, elevations: currentElevations, climate };
  
  // Stage N+2: Terrain classification
  const terrain = await classifyTerrain(geometry, currentElevations, climate);
  if (saveStages) stages.terrain = { geometry, plates, elevations: currentElevations, climate, terrain };
  
  // Stage N+3: Trees (part of terrain stage)
  const treeData = await generateTreeData(geometry, terrain);
  const terrainStageWithTrees = { geometry, plates, elevations: currentElevations, climate, terrain, treeData, seed };
  if (saveStages) stages.terrain = terrainStageWithTrees;
  
  return saveStages ? { stages, lastStage: terrainStageWithTrees } : terrainStageWithTrees;
}

// Convenience function for step-by-step generation
export async function generatePlanet(seed, config) {
  return generatePlanetStaged(seed, config, { saveStages: true, tectonicRuns: 3 });
}

```

#### 3.2 Incremental Rendering System
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
  
  // Update only colors when view mode changes
  function updateColors(viewMode) {
    const mesh = ensureBaseMesh();
    const colors = mapColors(planetData, viewMode);
    mesh.geometry.setAttribute('color', colors);
    mesh.geometry.attributes.color.needsUpdate = true;
  }
  
  // Toggle outlines without rebuilding planet
  function toggleOutlines(visible) {
    if (visible && !outlineMesh) {
      outlineMesh = renderOutlines(planetData.geometry);
      meshGroup.add(outlineMesh);
    } else if (!visible && outlineMesh) {
      meshGroup.remove(outlineMesh);
      outlineMesh.geometry.dispose();
      outlineMesh.material.dispose();
      outlineMesh = null;
    }
  }
  
  // Toggle trees without rebuilding planet
  function toggleTrees(visible) {
    if (visible && !treeMeshes && planetData.treeData) {
      treeMeshes = renderTrees(planetData.treeData);
      meshGroup.add(treeMeshes);
    } else if (!visible && treeMeshes) {
      meshGroup.remove(treeMeshes);
      disposeTrees(treeMeshes);
      treeMeshes = null;
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

### Phase 4: Additional Store Usage Areas


#### 4.3 Stage Viewing APIs

**Basic Stage Navigation:**
```javascript
// API for switching between generation stages
const stageViewer = {
  // Navigate stages
  goToStage: (stageName) => {
    useWorldStore.getState().setCurrentStage(stageName);
    // Renderer automatically updates to show that stage
  },
  
  // Get available stages for current planet
  getAvailableStages: () => {
    return useWorldStore.getState().availableStages;
    // Returns: ['geometry', 'plates', 'elevation-1', 'elevation-2', 'elevation-3', 'climate', 'terrain']
  },
  
};
```

**Stage Data Access:**
```javascript
// API for accessing stage-specific data
const stageData = {
  // Get data for specific stage
  getStageData: (stageName) => {
    return useWorldStore.getState().stageData[stageName];
  },
  
  // Get stage metadata
  getStageInfo: (stageName) => {
    const stageInfoMap = {
      'geometry': { name: 'Base Geometry', description: 'Voronoi tessellation of planet surface' },
      'plates': { name: 'Tectonic Plates', description: 'Initial plate boundaries and types' },
      'elevation-1': { name: 'Tectonic Run 1', description: 'First round of plate interactions' },
      'elevation-2': { name: 'Tectonic Run 2', description: 'Second round of plate movement' },
      'elevation-3': { name: 'Tectonic Run 3', description: 'Final tectonic stabilization' },
      'climate': { name: 'Climate Generation', description: 'Temperature and moisture patterns' },
      'terrain': { name: 'Terrain Classification', description: 'Biome assignment based on climate' }
    };
    return stageInfoMap[stageName];
  }
};
```

### Phase 5: Performance Benefits

#### 5.1 What Gets Regenerated vs. What Doesn't

**Full Regeneration Required:**
- Changing seed
- Changing number of tiles
- Changing number of plates
- Changing jitter or algorithm

**Incremental Updates Only:**
- **View Mode Changes**: Only updates vertex colors, keeps same geometry
- **Toggle Outlines**: Adds/removes outline mesh, planet untouched
- **Toggle Trees**: Adds/removes tree instances, planet untouched
- **Stage Navigation**: Switches which cached stage data to render
- **Elevation Bias**: Only recalculates colors based on adjusted elevation

**Example Performance:**
```javascript
// ❌ Old way - recreates everything
function updateViewMode(newMode) {
  scene.remove(planetGroup);
  planetGroup = generateAndDisplayPlanet(scene, config);
}

// ✅ New way - updates only colors
function updateViewMode(newMode) {
  planetRenderer.updateColors(newMode); // ~1ms vs ~500ms
}
```


### Phase 6: Improve Code Quality

#### 6.1 Extract Constants to Config Files
```javascript
// world/plate/plateConfig.js
export const PLATE_CONFIG = {
  oceanic: {
    chance: 0.7,
    elevationRange: [-0.9, -0.5]
  },
  continental: {
    chance: 0.3,
    elevationRange: [0.1, 0.5]
  },
  convergence: {
    strongThreshold: -0.4,
    features: {
      mountain: { elevation: 1.0, priority: 3 },
      trench: { offset: -0.45, priority: 2 },
      ridge: { elevation: -0.1, priority: 2 }
    }
  },
  smoothing: {
    passes: 2,
    weights: { original: 0.6, averaged: 0.4 }
  }
};
```

#### 6.2 Break Down Large Functions
```javascript
// world/plate/plateGenerator.js
export function generatePlates(geometry, numPlates) {
  const seedPoints = generateSeedPoints(geometry.tiles, numPlates);
  const plates = createPlatesFromSeeds(seedPoints);
  const tileAssignments = assignTilesToPlates(geometry.tiles, plates);
  const refinedPlates = refinePlateCenters(plates, geometry.tiles, tileAssignments);
  return { plates: refinedPlates, tileAssignments };
}

function generateSeedPoints(tiles, numPlates) { /* ... */ }
function createPlatesFromSeeds(seedPoints) { /* ... */ }
function assignTilesToPlates(tiles, plates) { /* ... */ }
function refinePlateCenters(plates, tiles, assignments) { /* ... */ }
```

### Phase 7: Implement Testing Strategy

#### 7.1 Unit Tests
```javascript
// __tests__/world/plate/plateGenerator.test.js
describe('plateGenerator', () => {
  test('generates correct number of plates', () => {
    const tiles = createMockTiles(100);
    const result = generatePlates({ tiles }, 5);
    expect(result.plates.length).toBe(5);
  });
  
  test('assigns all tiles to plates', () => {
    const tiles = createMockTiles(50);
    const result = generatePlates({ tiles }, 3);
    expect(Object.keys(result.tileAssignments)).toHaveLength(50);
  });
});
```

#### 7.2 Integration Tests
```javascript
// __tests__/integration/planetGeneration.test.js
describe('Planet Generation Pipeline', () => {
  test('generates consistent planet with same seed', async () => {
    const config = { numTiles: 100, numPlates: 5 };
    const planet1 = await generatePlanet('test123', config);
    const planet2 = await generatePlanet('test123', config);
    expect(planet1.seed).toBe(planet2.seed);
    expect(planet1.geometry.tiles.length).toBe(planet2.geometry.tiles.length);
  });
});
```

### Implementation Order

1. **Week 1**: Extract tree module, reorganize by game objects
2. **Week 2**: Split world generation into functional pipeline
3. **Week 3**: Implement proper stores, remove global state
4. **Week 4**: Implement incremental rendering system
5. **Week 5**: Add stage viewing and additional stores
6. **Week 6**: Break down large functions, extract constants
7. **Week 7**: Add tests and documentation

### Benefits

1. **Maintainability**: Clear separation by game objects
2. **Testability**: Pure functions can be tested in isolation
3. **Reusability**: Functional modules are easily composable
4. **Simplicity**: Flat structure, no deep nesting
5. **Scalability**: Easy to add new game objects
6. **Developer Experience**: Clear APIs, predictable structure

### Migration Strategy

1. Create new structure alongside existing code
2. Migrate one game object at a time (tree → planet → plate → terrain → climate)
3. Keep backwards compatibility during transition
4. Update imports gradually
5. Remove old code only after full validation

This refactoring will transform the codebase into a clean, functional architecture organized around game objects, making it much easier to understand and maintain.

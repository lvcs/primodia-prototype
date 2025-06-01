# Tree System Testing Integration Guide

## Quick Integration

### 1. Update your `worldGenerator.js`

Replace the tree generation section with the testing system:

```javascript
// Add to imports at top of file
import { setupTreeTesting, updateCurrentTreeSystem } from './TreeTester.js';

// In your generateWorld function, replace the existing tree code:
export function generateWorld(config, seed) {
  // ... existing code ...

  // OLD tree code - replace this section:
  /*
  if (tilesForTrees.length > 0) {
    const treeResult = addTreesToScene(tilesForTrees, meshGroup);
    meshGroup.userData.treeData = treeResult;
    
    if (treeResult.stats) {
      console.log(`[Trees] Generated ${treeResult.stats.totalTrees} trees using instanced rendering (Memory: ${(treeResult.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
  */

  // NEW testing system:
  if (tilesForTrees.length > 0) {
    // Initialize testing for all three systems
    const cameraPosition = new THREE.Vector3(0, 0, config.radius + 1000); // Default camera position
    const testResult = setupTreeTesting(tilesForTrees, meshGroup, cameraPosition);
    
    // Store testing system data
    meshGroup.userData.treeTestingActive = true;
    meshGroup.userData.treeTestData = tilesForTrees;
    
    console.log('[Trees] Testing system initialized. Use console commands to switch:');
    console.log('- switchTreeSystem("current", scene, cameraPosition)');
    console.log('- switchTreeSystem("lod", scene, cameraPosition)');  
    console.log('- switchTreeSystem("minimal", scene, cameraPosition)');
  }

  return { meshGroup, planet, config, actualSeed: effectiveSeed };
}
```

### 2. Update your camera/render loop

Add this to your main render loop to update LOD systems when camera moves:

```javascript
// In your main render loop (wherever you handle camera updates)
function renderLoop() {
  // ... existing render code ...
  
  // Update tree system if testing is active
  if (worldMesh && worldMesh.userData.treeTestingActive) {
    updateCurrentTreeSystem(worldMesh, camera.position);
  }
  
  // ... rest of render code ...
}
```

## Console Testing Commands

Once integrated, you can use these commands in the browser console:

### Basic Commands
```javascript
// Switch between systems
switchTreeSystem("current", scene, camera.position)
switchTreeSystem("lod", scene, camera.position) 
switchTreeSystem("minimal", scene, camera.position)

// Get performance comparison
getTreeTestStats()

// Run automated performance test
runTreePerformanceTest(scene, camera.position)
```

### Advanced Usage
```javascript
// Test with different camera positions
const testPositions = [
  new THREE.Vector3(0, 0, 1500),    // Close to surface
  new THREE.Vector3(0, 0, 3000),    // Medium distance  
  new THREE.Vector3(0, 0, 8000)     // Far distance
];

testPositions.forEach((pos, i) => {
  console.log(`Testing position ${i + 1}:`);
  switchTreeSystem("lod", scene, pos);
  getTreeTestStats();
});
```

## Expected Results

### Memory Usage Comparison
- **Current System**: ~7 MB (after fix) 
- **LOD System**: ~2-3 MB (60-70% reduction)
- **Minimal System**: ~0.4 MB (94% reduction)

### Visual Quality
- **Current**: High quality, separate trunk/canopy
- **LOD**: High quality close, billboards far
- **Minimal**: Simple but efficient, good for distant viewing

### Performance
- **Current**: Good for medium tree counts
- **LOD**: Best balance of quality and performance  
- **Minimal**: Fastest rendering, lowest memory

## Manual Integration (Alternative)

If you prefer more control, you can integrate each system manually:

### LOD System Only
```javascript
import { 
  generateTreesFromTiles, 
  renderTreesWithLOD, 
  clearLODTrees 
} from './TreeLODFunctional.js';

// Generate tree data
const trees = generateTreesFromTiles(tilesForTrees);

// Render with LOD
const { meshes, stats } = renderTreesWithLOD(trees, scene, cameraPosition);

// In render loop (when camera moves significantly)
clearLODTrees(scene, meshes);
const newResult = renderTreesWithLOD(trees, scene, newCameraPosition);
```

### Minimal System Only
```javascript
import { 
  generateMinimalTreeData, 
  renderMinimalTrees, 
  clearMinimalTrees 
} from './TreeMinimalFunctional.js';

// Generate compressed data
const treeData = generateMinimalTreeData(tilesForTrees);

// Render trees
const planetRadius = config.radius; // Your planet radius
const { meshes, stats } = renderMinimalTrees(treeData, scene, cameraPosition, planetRadius);

// Update when camera moves
clearMinimalTrees(scene, meshes);
const newResult = renderMinimalTrees(treeData, scene, newCameraPosition, planetRadius);
```

## Testing Checklist

1. **Initial Setup**
   - [ ] Integration code added to worldGenerator.js
   - [ ] Console commands working
   - [ ] All three systems load without errors

2. **Memory Testing**
   - [ ] Switch to each system and check memory usage
   - [ ] Run `getTreeTestStats()` to compare
   - [ ] Verify minimal system shows 90%+ reduction

3. **Performance Testing**
   - [ ] Run `runTreePerformanceTest()` 
   - [ ] Test at different camera distances
   - [ ] Verify LOD system changes detail levels

4. **Visual Testing**  
   - [ ] Check tree appearance in each system
   - [ ] Verify billboards face camera properly
   - [ ] Test at different zoom levels

## Troubleshooting

### Common Issues

**"No test data" errors**
- Make sure `setupTreeTesting()` was called with valid tile data
- Check that `tilesForTrees` has forest/tree tiles

**LOD system not updating**
- Ensure `updateCurrentTreeSystem()` is called in render loop
- Camera position must be a THREE.Vector3

**Memory still high**
- First test the fixed current system to verify the bug fix
- Use browser dev tools to check actual memory usage

**Minimal system positioning issues**
- Make sure `planetRadius` parameter matches your world radius
- Check that tile centers are in world coordinates

### Performance Tips

1. **LOD distances**: Adjust distances in `TreeLODFunctional.js` for your world scale
2. **Update frequency**: Only call `updateCurrentTreeSystem()` when camera moves significantly  
3. **Tree density**: Reduce density in minimal system for better performance
4. **Billboard resolution**: Adjust canvas size in billboard creation for quality vs memory

## Next Steps

1. **Test all systems** and identify which works best for your use case
2. **Tune parameters** (LOD distances, tree density, etc.) for your world scale
3. **Choose final system** and remove testing code for production
4. **Consider spatial culling** for very large worlds (future enhancement)

The testing system makes it easy to compare approaches and find the optimal solution for your specific requirements! 
import * as THREE from 'three';
import { 
  renderTreesWithLOD, 
  clearLODTrees, 
  disposeLODResources,
  generateTreesFromTiles 
} from './TreeLODFunctional.js';
import { 
  generateMinimalTreeData, 
  renderMinimalTrees, 
  clearMinimalTrees, 
  disposeMinimalResources,
  getMinimalMemoryComparison 
} from './TreeMinimalFunctional.js';
import { addTreesToScene, clearTrees } from '../../client/src/game/world/Tree.js';

/**
 * Tree System Comparison and Testing Tool
 * Functional approach for testing different tree optimization strategies
 */

// Test configuration
const TEST_CONFIG = {
  enableTesting: true,
  logPerformance: true,
  autoSwitchInterval: 0, // 0 = manual switching only
  systems: {
    current: 'Current Instanced System',
    lod: 'LOD System (Functional)',
    minimal: 'Minimal System (Functional)'
  }
};

// Global test state
let currentTestSystem = 'current';
let testData = {
  current: null,
  lod: null,
  minimal: null
};
let activeMeshes = [];
let performanceMetrics = {};

/**
 * Initialize testing system
 */
export function initializeTreeTesting() {
  console.log('[TreeTester] Testing system initialized');
  console.log('Available systems:', Object.values(TEST_CONFIG.systems));
  console.log('Use switchTreeSystem("lod"|"minimal"|"current") to switch');
  
  // Add global functions for easy testing in console
  if (typeof window !== 'undefined') {
    window.switchTreeSystem = switchTreeSystem;
    window.getTreeTestStats = getTreeTestStats;
    window.runTreePerformanceTest = runTreePerformanceTest;
  }
}

/**
 * Generate test data for all systems
 */
export function generateTestData(tiles) {
  console.log('[TreeTester] Generating test data for all systems...');
  
  const startTime = performance.now();
  
  // Generate data for each system
  testData.current = tiles; // Current system uses tiles directly
  testData.lod = generateTreesFromTiles(tiles);
  testData.minimal = generateMinimalTreeData(tiles);
  
  const endTime = performance.now();
  
  console.log(`[TreeTester] Test data generated in ${(endTime - startTime).toFixed(2)}ms`);
  console.log('Data sizes:');
  console.log(`- Current: ${tiles.length} tiles`);
  console.log(`- LOD: ${testData.lod.length} tree objects`);
  console.log(`- Minimal: ${testData.minimal.count} trees (${testData.minimal.memoryUsage} bytes)`);
  
  return testData;
}

/**
 * Switch between tree systems
 */
export function switchTreeSystem(systemName, scene, cameraPosition) {
  if (!TEST_CONFIG.systems[systemName]) {
    console.error(`[TreeTester] Unknown system: ${systemName}`);
    console.log('Available systems:', Object.keys(TEST_CONFIG.systems));
    return false;
  }
  
  console.log(`[TreeTester] Switching to: ${TEST_CONFIG.systems[systemName]}`);
  
  // Clear current system
  clearCurrentSystem(scene);
  
  // Switch to new system
  const startTime = performance.now();
  currentTestSystem = systemName;
  
  let result = null;
  
  switch (systemName) {
    case 'current':
      result = renderCurrentSystem(scene);
      break;
    case 'lod':
      result = renderLODSystem(scene, cameraPosition);
      break;
    case 'minimal':
      result = renderMinimalSystem(scene, cameraPosition);
      break;
  }
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  // Log performance
  if (result) {
    logSystemPerformance(systemName, result, renderTime);
  }
  
  return true;
}

/**
 * Clear current active system
 */
function clearCurrentSystem(scene) {
  switch (currentTestSystem) {
    case 'current':
      clearTrees(scene);
      break;
    case 'lod':
      clearLODTrees(scene, activeMeshes);
      break;
    case 'minimal':
      clearMinimalTrees(scene, activeMeshes);
      break;
  }
  activeMeshes = [];
}

/**
 * Render current/original system
 */
function renderCurrentSystem(scene) {
  if (!testData.current) {
    console.error('[TreeTester] No test data for current system');
    return null;
  }
  
  const result = addTreesToScene(testData.current, scene);
  return {
    stats: result.stats,
    systemName: 'current'
  };
}

/**
 * Render LOD system
 */
function renderLODSystem(scene, cameraPosition) {
  if (!testData.lod) {
    console.error('[TreeTester] No test data for LOD system');
    return null;
  }
  
  const result = renderTreesWithLOD(testData.lod, scene, cameraPosition);
  activeMeshes = result.meshes;
  
  return {
    stats: result.stats,
    systemName: 'lod'
  };
}

/**
 * Render minimal system
 */
function renderMinimalSystem(scene, cameraPosition) {
  if (!testData.minimal) {
    console.error('[TreeTester] No test data for minimal system');
    return null;
  }
  
  // Need sphere radius for minimal system
  const sphereRadius = 1000; // You'll need to pass this from your world generator
  
  const result = renderMinimalTrees(testData.minimal, scene, cameraPosition, sphereRadius);
  activeMeshes = result.meshes;
  
  return {
    stats: result.stats,
    systemName: 'minimal'
  };
}

/**
 * Log performance metrics
 */
function logSystemPerformance(systemName, result, renderTime) {
  performanceMetrics[systemName] = {
    renderTime,
    stats: result.stats,
    timestamp: Date.now()
  };
  
  console.log(`[TreeTester] ${TEST_CONFIG.systems[systemName]} Performance:`);
  console.log(`- Render time: ${renderTime.toFixed(2)}ms`);
  
  if (result.stats) {
    if (result.stats.totalTrees !== undefined) {
      console.log(`- Total trees: ${result.stats.totalTrees}`);
      console.log(`- Memory: ${(result.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    } else if (result.stats.total !== undefined) {
      console.log(`- Total trees: ${result.stats.total}`);
      console.log(`- Detailed: ${result.stats.detailed || 0}`);
      console.log(`- Simple: ${result.stats.simple || 0}`);
      console.log(`- Billboard/Cross: ${result.stats.billboard || result.stats.cross || 0}`);
      console.log(`- Memory estimate: ${(result.stats.memoryEstimate / 1024 / 1024).toFixed(2)} MB`);
    }
  }
}

/**
 * Get comparison stats for all systems
 */
export function getTreeTestStats() {
  console.log('\n=== Tree System Comparison ===');
  
  Object.entries(performanceMetrics).forEach(([systemName, metrics]) => {
    console.log(`\n${TEST_CONFIG.systems[systemName]}:`);
    console.log(`- Last render: ${metrics.renderTime.toFixed(2)}ms`);
    
    if (metrics.stats.totalTrees !== undefined) {
      console.log(`- Trees: ${metrics.stats.totalTrees}`);
      console.log(`- Memory: ${(metrics.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    } else if (metrics.stats.total !== undefined) {
      console.log(`- Trees: ${metrics.stats.total}`);
      console.log(`- Memory: ${(metrics.stats.memoryEstimate / 1024 / 1024).toFixed(2)} MB`);
    }
  });
  
  // Memory comparison if minimal system tested
  if (testData.minimal) {
    console.log('\n=== Memory Comparison ===');
    const comparison = getMinimalMemoryComparison(testData.minimal.count);
    console.log(`Original: ${comparison.original}`);
    console.log(`Minimal: ${comparison.minimal}`);
    console.log(`Reduction: ${comparison.reduction}`);
  }
  
  return performanceMetrics;
}

/**
 * Run automated performance test
 */
export function runTreePerformanceTest(scene, cameraPosition, iterations = 3) {
  console.log(`[TreeTester] Running performance test (${iterations} iterations per system)...`);
  
  const systems = Object.keys(TEST_CONFIG.systems);
  const results = {};
  
  systems.forEach(systemName => {
    console.log(`\nTesting ${TEST_CONFIG.systems[systemName]}...`);
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      switchTreeSystem(systemName, scene, cameraPosition);
      const endTime = performance.now();
      times.push(endTime - startTime);
      
      // Small delay between iterations
      if (i < iterations - 1) {
        setTimeout(() => {}, 100);
      }
    }
    
    results[systemName] = {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times
    };
  });
  
  // Log results
  console.log('\n=== Performance Test Results ===');
  Object.entries(results).forEach(([systemName, result]) => {
    console.log(`\n${TEST_CONFIG.systems[systemName]}:`);
    console.log(`- Average: ${result.average.toFixed(2)}ms`);
    console.log(`- Min: ${result.min.toFixed(2)}ms`);
    console.log(`- Max: ${result.max.toFixed(2)}ms`);
  });
  
  return results;
}

/**
 * Update current system (for camera movement, etc.)
 */
export function updateCurrentTreeSystem(scene, cameraPosition) {
  if (currentTestSystem === 'lod' && testData.lod) {
    // Clear and re-render LOD system with new camera position
    clearLODTrees(scene, activeMeshes);
    const result = renderLODSystem(scene, cameraPosition);
    if (result) {
      logSystemPerformance('lod', result, 0); // 0 for update time
    }
  } else if (currentTestSystem === 'minimal' && testData.minimal) {
    // Clear and re-render minimal system with new camera position
    clearMinimalTrees(scene, activeMeshes);
    const result = renderMinimalSystem(scene, cameraPosition);
    if (result) {
      logSystemPerformance('minimal', result, 0);
    }
  }
  // Current system doesn't need updates for camera movement
}

/**
 * Clean up all test systems
 */
export function disposeTreeTesting(scene) {
  clearCurrentSystem(scene);
  disposeLODResources();
  disposeMinimalResources();
  
  testData = { current: null, lod: null, minimal: null };
  performanceMetrics = {};
  
  console.log('[TreeTester] All test systems disposed');
}

/**
 * Quick setup function for easy integration
 */
export function setupTreeTesting(tiles, scene, cameraPosition) {
  initializeTreeTesting();
  generateTestData(tiles);
  
  console.log('\n=== Quick Test Commands ===');
  console.log('switchTreeSystem("current", scene, cameraPosition)');
  console.log('switchTreeSystem("lod", scene, cameraPosition)');
  console.log('switchTreeSystem("minimal", scene, cameraPosition)');
  console.log('getTreeTestStats()');
  console.log('runTreePerformanceTest(scene, cameraPosition)');
  
  // Start with current system
  return switchTreeSystem('current', scene, cameraPosition);
} 
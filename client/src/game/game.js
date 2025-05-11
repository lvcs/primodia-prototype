import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
import { createVoronoiSphereRenderer } from './world/voronoiSphere.js';
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug, logWorldStructure } from './debug.js';

let scene, camera, renderer, controls;
let world, planetGroup;
let worldConfig;
let isMouseDown = false;

export function initGame() {
  try {
    debug('Initializing game...');
    initDebug();
    
    setupThreeJS();
    setupWorld();
    setupLighting();
    setupControls();
    setupEventListeners();
    setupSocketConnection();
    setupTileDensitySlider();
    setupMouseTracking();
    animate();
    
    debug('Game initialized successfully');
  } catch (e) {
    error('Error initializing game:', e);
  }
}

function setupThreeJS() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a2a);
  
  // Create camera
  camera = new THREE.PerspectiveCamera(
    60, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);
  
  // Create renderer with anti-aliasing for smoother edges
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Enable shadow casting for better visuals
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function setupWorld() {
  // Game world configuration - store it globally so it can be modified
  worldConfig = {
    radius: 10,          // Planet radius
    detail: 2,           // Detail level (0-4, higher = more cells but more performance cost)
    waterLevel: 0.35,    // Water level threshold (0-1)
    mountainLevel: 0.75  // Mountain level threshold (0-1)
  };
  
  generatePlanet();
}

// Extract the planet generation to a separate function so it can be called when the slider changes
function generatePlanet() {
  try {
    debug(`Generating planet with config: ${JSON.stringify(worldConfig)}`);
    
    // Clear previous planet if it exists
    if (planetGroup) {
      scene.remove(planetGroup);
      
      // Dispose of geometries and materials to prevent memory leaks
      planetGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    
    // Remove ocean sphere if it exists
    const oceanSphere = scene.children.find(child => 
      child.userData && child.userData.isOcean
    );
    if (oceanSphere) {
      scene.remove(oceanSphere);
      oceanSphere.geometry.dispose();
      oceanSphere.material.dispose();
    }
    
    // Generate world data
    debug('Calling generateWorld...');
    world = generateWorld(worldConfig);
    debug('World generated');
    
    // Log the world structure for debugging
    logWorldStructure(world);
    
    // Create visual representation
    debug('Creating visual representation...');
    planetGroup = createVoronoiSphereRenderer(world, scene);
    debug('Visual representation created');
    
    // Count tiles for display (with error handling)
    let totalTiles = 0;
    let landTiles = 0;
    let waterTiles = 0;

    if (world && world.hexes && Array.isArray(world.hexes)) {
      totalTiles = world.hexes.length;
      landTiles = world.hexes.filter(t => t && t.data && t.data.terrainType !== 'ocean').length;
      waterTiles = totalTiles - landTiles;
    }
    
    // Update tile density display with tile counts
    const densityValue = document.getElementById('hex-density-value');
    if (densityValue) {
      densityValue.textContent = `${worldConfig.detail} (${totalTiles} tiles: ${landTiles} land, ${waterTiles} water)`;
    }
    
    // Add a subtle ambient glow around the planet
    addPlanetaryGlow(worldConfig.radius);
    
    debug('Planet generation complete');
  } catch (err) {
    error('Error in generatePlanet:', err);
    // Create a fallback sphere
    const fallbackGeometry = new THREE.SphereGeometry(worldConfig.radius, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0x1a75b0 });
    planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    scene.add(planetGroup);
  }
}

function addPlanetaryGlow(radius) {
  // Create a sphere slightly larger than the planet
  const glowGeometry = new THREE.SphereGeometry(radius * 1.1, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x4477aa,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.userData.isGlow = true;
  scene.add(glowMesh);
}

function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(50, 50, 50);
  
  // Enable shadow casting for the sun light
  sunLight.castShadow = true;
  
  // Configure shadow properties for better quality
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.bias = -0.0005;
  
  scene.add(sunLight);
  
  // Add a hemisphere light for better color balance
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
  scene.add(hemisphereLight);
}

function setupControls() {
  // Orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 12;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 1.5;
  
  // Start with a nice view angle
  camera.position.set(15, 10, 15);
  controls.update();
}

function setupEventListeners() {
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Handle tile selection
  renderer.domElement.addEventListener('click', onTileClick);
}

// Set up the tile density slider
function setupTileDensitySlider() {
  const slider = document.getElementById('hex-density-slider');
  if (!slider) return;
  
  // Set initial value
  slider.value = worldConfig.detail;
  
  // Count tiles for display (with error handling)
  let totalTiles = 0;
  let landTiles = 0;
  let waterTiles = 0;

  if (world && world.hexes && Array.isArray(world.hexes)) {
    totalTiles = world.hexes.length;
    landTiles = world.hexes.filter(t => t && t.data && t.data.terrainType !== 'ocean').length;
    waterTiles = totalTiles - landTiles;
  }
  
  // Update tile density display
  const densityValue = document.getElementById('hex-density-value');
  if (densityValue) {
    densityValue.textContent = `${worldConfig.detail} (${totalTiles} tiles: ${landTiles} land, ${waterTiles} water)`;
  }
  
  // Listen for changes
  slider.addEventListener('input', (e) => {
    const newDetail = parseInt(e.target.value, 10);
    if (newDetail !== worldConfig.detail) {
      worldConfig.detail = newDetail;
      generatePlanet();
    }
  });
}

function onTileClick(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Raycaster for selecting tiles
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // Get all tile meshes from the scene
  const tileMeshes = scene.children.filter(child => 
    child.userData && child.userData.isCell
  );
  
  // If no tiles are found in the scene directly, look in the planetGroup
  let meshesToCheck = tileMeshes;
  if (tileMeshes.length === 0 && planetGroup) {
    meshesToCheck = [];
    planetGroup.traverse(child => {
      if (child.userData && child.userData.isCell) {
        meshesToCheck.push(child);
      }
    });
  }
  
  // Check for intersections
  const intersects = raycaster.intersectObjects(meshesToCheck);
  
  if (intersects.length > 0) {
    const selectedTile = intersects[0].object;
    selectTile(selectedTile);
  }
}

function selectTile(tileMesh) {
  // Clear any previous selection with smooth transition
  scene.traverse(child => {
    if (child.userData && child.userData.isCell && child.userData.selected) {
      // Smoothly transition emissive color back to zero
      const transitionStep = 0.05;
      const interval = setInterval(() => {
        const currentEmissive = child.material.emissive.getHex();
        const r = ((currentEmissive >> 16) & 255) / 255;
        const g = ((currentEmissive >> 8) & 255) / 255;
        const b = (currentEmissive & 255) / 255;
        
        // Reduce each component
        const newR = Math.max(0, r - transitionStep);
        const newG = Math.max(0, g - transitionStep);
        const newB = Math.max(0, b - transitionStep);
        
        if (newR <= 0 && newG <= 0 && newB <= 0) {
          child.material.emissive.setHex(0x000000);
          child.userData.selected = false;
          clearInterval(interval);
        } else {
          child.material.emissive.setRGB(newR, newG, newB);
        }
      }, 30);
    }
  });
  
  // Get the tile data from the mesh
  const tileData = tileMesh.userData.cellData;
  
  // Log tile data for debugging
  console.log(`Selected tile: ${tileData.terrainType}`, tileData);
  
  // Highlight the selected tile with a pulsing effect
  tileMesh.userData.selected = true;
  tileMesh.userData.pulseDirection = 1;
  tileMesh.userData.pulseValue = 0;
  
  // Create a pulse effect for the selected tile
  tileMesh.userData.pulseInterval = setInterval(() => {
    const pulseValue = tileMesh.userData.pulseValue;
    const pulseDirection = tileMesh.userData.pulseDirection;
    
    // Update pulse value
    tileMesh.userData.pulseValue += 0.05 * pulseDirection;
    
    // Change direction if at extremes
    if (tileMesh.userData.pulseValue >= 1) {
      tileMesh.userData.pulseDirection = -1;
    } else if (tileMesh.userData.pulseValue <= 0) {
      tileMesh.userData.pulseDirection = 1;
    }
    
    // Set emissive color based on pulse value (0.2 to 0.5 range)
    const intensity = 0.2 + (0.3 * tileMesh.userData.pulseValue);
    tileMesh.material.emissive.setRGB(intensity, intensity, intensity);
  }, 30);
  
  // Show tile information in UI
  updateTileInfoPanel(tileData);
}

function updateTileInfoPanel(tileData) {
  // Check if the info panel exists, create if not
  let infoPanel = document.getElementById('tile-info-panel');
  if (!infoPanel) {
    infoPanel = document.createElement('div');
    infoPanel.id = 'tile-info-panel';
    infoPanel.style.position = 'absolute';
    infoPanel.style.top = '10px';
    infoPanel.style.right = '10px';
    infoPanel.style.width = '250px';
    infoPanel.style.padding = '15px';
    infoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoPanel.style.color = 'white';
    infoPanel.style.borderRadius = '5px';
    infoPanel.style.fontFamily = 'Arial, sans-serif';
    infoPanel.style.zIndex = '1000';
    infoPanel.style.opacity = '0';
    infoPanel.style.transition = 'opacity 0.5s';
    document.body.appendChild(infoPanel);
  }
  
  // Format resource text
  let resourceText = tileData.resource !== 'none' 
    ? `<span style="color: #FFEB3B">${tileData.resource}</span>` 
    : 'none';
  
  // Set panel content with tile data
  infoPanel.innerHTML = `
    <h3 style="margin-top: 0; color: #4CAF50">Selected Tile</h3>
    <p><strong>Terrain:</strong> ${tileData.terrainType}</p>
    <p><strong>Resource:</strong> ${resourceText}</p>
    <p><strong>Elevation:</strong> ${Math.round(tileData.elevation * 100)}%</p>
    <p><strong>Temperature:</strong> ${Math.round(tileData.temperature * 100)}%</p>
    <p><strong>Moisture:</strong> ${Math.round(tileData.moisture * 100)}%</p>
  `;
  
  // Fade in the panel
  setTimeout(() => {
    infoPanel.style.opacity = '1';
  }, 10);
}

// Add subtle planet rotation
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Add very subtle rotation to the world for a more dynamic feel
  if (planetGroup && !isMouseDown) {
    planetGroup.rotation.y += 0.0003;
  }
  
  // Render scene
  renderer.render(scene, camera);
}

// Track mouse state for rotation control
function setupMouseTracking() {
  window.addEventListener('mousedown', () => {
    isMouseDown = true;
  });
  
  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });
  
  window.addEventListener('mouseleave', () => {
    isMouseDown = false;
  });
} 
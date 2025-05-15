import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// Import sphere settings and draw mode
import { sphereSettings, DrawMode, classifyTerrain } from './world/planetSphereVoronoi.js';
import { MapTypes, MapRegistry } from './world/registries/MapTypeRegistry.js';
import { Terrains } from './world/registries/TerrainRegistry.js';
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug } from './debug.js';
import * as Const from '../config/gameConstants.js'; // Import constants
// Keybindings are now used by keyboardControls.js, not directly here.
// import { getActionForKey, Actions } from '../config/keybindings.js'; 

// Import new control modules
import { initMouseControls, disposeMouseControls } from './controls/mouseControls.js';
import { initKeyboardControls, handleKeyboardInput, disposeKeyboardControls } from './controls/keyboardControls.js';
import { ZoomControlsComponent, updateUIDisplay as updateComponentUIDisplay } from '../ui/components/ZoomControls.js'; // Corrected import path, renamed update function

let scene, camera, renderer, controls;
let worldData; // Will store { meshGroup, cells, config } from generateWorld
let planetGroup; // This will be worldData.meshGroup
let worldConfig;
let isMouseDown = false;
let selectedHighlight = null;

const clock = new THREE.Clock(); // For deltaTime

// State for mouse panning - MOVED to mouseControls.js
// let isDragging = false;
// const previousMousePosition = {
// x: 0,
// y: 0
// };

// State for keyboard controls - MOVED to keyboardControls.js
// const activeKeys = new Set();

export function initGame() {
  try {
    debug('Initializing game (fresh start)...');
    initDebug();
    
    setupThreeJS();
    setupWorldConfig();
    // Initialize controls before planet generation so sliders have correct values
    // const pointsSlider = document.getElementById('points-slider'); // This line might be from old code
    // if (pointsSlider) {                                           // if points-slider isn't relevant, remove
    //   pointsSlider.max = sphereSettings.numPoints;             // these three lines
    // }
    // updateControlValues(); // This seems to be for the main control panel, ensure it runs if needed for other sliders
    
    generateAndDisplayPlanet(); 
    setupLighting();
    setupControls(); // Sets up OrbitControls
    setupEventListeners(); // Sets up mouse/keyboard listeners
    
    // Initialize UI Zoom Controls after camera and OrbitControls are ready
    // initZoomControls(camera, controls, worldConfig); // Old initialization
    // updateZoomDisplay(); // Old initial display update

    // Ensure planetGroup is initialized before creating ZoomControlsComponent if it depends on it directly
    // Since planetGroup is initialized within generateAndDisplayPlanet, this ordering should be okay.
    const zoomControlsElement = ZoomControlsComponent(camera, controls, worldConfig, planetGroup);
    const uiOverlay = document.getElementById('ui-overlay') || document.body;
    uiOverlay.appendChild(zoomControlsElement);
    // Ensure pointer events are enabled for the zoom controls container if ui-overlay has pointer-events: none;
    // This is handled by the CSS for #zoom-controls-container if it's a direct child or has its own pointer-events: auto.
    if (uiOverlay.id === 'ui-overlay' && getComputedStyle(uiOverlay).pointerEvents === 'none') {
        zoomControlsElement.style.pointerEvents = 'auto'; // Allow interaction if parent is non-interactive
    }

    updateComponentUIDisplay(camera, controls, planetGroup); // Initial display update using the component's exported function

    setupSocketConnection();
    setupMouseTracking();
    animate();
    
    debug('Game initialized successfully (fresh start).');
    // Hide loading overlay and show the game
    const loadingElem = document.getElementById('loading-container');
    if (loadingElem) loadingElem.style.display = 'none';
    const gameElem = document.getElementById('game-container');
    if (gameElem) gameElem.style.display = 'block';
  } catch (e) {
    error('Error initializing game (fresh start):', e);
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;padding:20px;background:red;color:white;z-index:99999;';
    errDiv.innerHTML = `<h1>Game Init Error</h1><p>${e.message}</p><pre>${e.stack}</pre>`;
    document.body.appendChild(errDiv);
  }
}

function setupThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(Const.SCENE_BACKGROUND_COLOR);
  camera = new THREE.PerspectiveCamera(Const.CAMERA_FOV, window.innerWidth / window.innerHeight, Const.CAMERA_NEAR_PLANE, Const.CAMERA_FAR_PLANE);
  camera.position.set(0, 0, 25); // Initial Z will be overridden by setupControls based on radius
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function setupWorldConfig() {
  worldConfig = {
    radius: Const.GLOBE_RADIUS, // Use the new fixed global constant
    detail: Const.DEFAULT_WORLD_DETAIL, 
  };
  debug('Initial worldConfig set:', worldConfig);
}

export function generateAndDisplayPlanet() {
  try {
    // Synchronize worldConfig.radius with sphereSettings.radius - REMOVED
    // let radiusChanged = false;
    // if (sphereSettings.radius !== undefined && sphereSettings.radius !== worldConfig.radius) {
    //   worldConfig.radius = sphereSettings.radius;
    //   radiusChanged = true;
    //   debug(`Globe radius changed to: ${worldConfig.radius}`);
    // }

    // worldConfig.radius is now fixed, so radiusChanged logic is no longer needed for it.
    // However, other parts of generateAndDisplayPlanet might still rely on a 'radiusChanged' concept
    // if other settings could trigger a full control re-setup. For now, assume radius is the primary one.
    // If !controls, it implies first run, so setupControls will be called.
    let controlsNeedSetup = !controls;

    debug(`Generating planet with config: ${JSON.stringify(worldConfig)}`);
    
    if (planetGroup) {
      scene.remove(planetGroup);
      planetGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      planetGroup = null;
    }
    const oldGlowMesh = scene.children.find(child => child.userData && child.userData.isGlow);
    if (oldGlowMesh) {
        scene.remove(oldGlowMesh);
        if(oldGlowMesh.geometry) oldGlowMesh.geometry.dispose();
        if(oldGlowMesh.material) oldGlowMesh.material.dispose();
    }

    // generateWorld calls generateAndCreatePlanetMesh internally now
    worldData = generateWorld(worldConfig); 
    
    if (worldData && worldData.meshGroup) {
      planetGroup = worldData.meshGroup;
      // Initialize userData for physics based rotation
      planetGroup.userData.angularVelocity = new THREE.Vector3(0, 0, 0);
      planetGroup.userData.targetAngularVelocity = new THREE.Vector3(0, 0, 0);
      planetGroup.userData.isBeingDragged = false;
      scene.add(planetGroup);
      debug('Planet mesh group added to scene.');
    } else {
      error('Failed to generate planet mesh group. worldData:', worldData);
      const fallbackGeo = new THREE.SphereGeometry(worldConfig.radius, 32, 32);
      const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
      planetGroup = new THREE.Mesh(fallbackGeo, fallbackMat);
      scene.add(planetGroup);
    }

    if (worldData && worldData.cells) {
        debug('Simplified world data log:', {cellCount: worldData.cells.length, config: worldData.config});
    }

    // Update controls only if sliders exist (dynamic UI setup)
    if (document.getElementById('points-slider')) {
      updateControlValues();
    }
    
    // If radius changed, controls need to be re-setup
    // Also, setup controls after the first planet generation.
    // if (radiusChanged || !controls) { // !controls implies first run
    //     setupControls(); 
    // }
    // Simplified: setup controls only if they haven't been set up yet.
    // Any dynamic changes that require control re-setup would need their own flag.
    if (controlsNeedSetup) {
        setupControls(); 
    }

    addPlanetaryGlow(worldConfig.radius); // This will use the fixed radius

    // Apply current view mode colors
    if(sphereSettings.viewMode==='plates'){
      updatePlanetColors();
    }
    debug('Planet generation and display complete.');
  } catch (err) {
    error('Error in generateAndDisplayPlanet:', err);
    if (planetGroup) scene.remove(planetGroup); 
    const fallbackGeometry = new THREE.SphereGeometry(worldConfig?.radius || 10, 32, 32);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    planetGroup = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    scene.add(planetGroup);
  }
}

function addPlanetaryGlow(radius) {
  const glowGeometry = new THREE.SphereGeometry(radius * Const.PLANETARY_GLOW_RADIUS_FACTOR, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ color: Const.PLANETARY_GLOW_COLOR, transparent: true, opacity: Const.PLANETARY_GLOW_OPACITY, side: THREE.BackSide });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.userData.isGlow = true;
  scene.add(glowMesh);
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0x606080, 1);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(50, 50, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  scene.add(hemisphereLight);
}

function setupControls() {
  // If controls exist, dispose of them first
  if (controls) {
    controls.dispose();
    disposeMouseControls(); 
    disposeKeyboardControls();
  }
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  // worldConfig.radius is now fixed from GLOBE_RADIUS
  controls.minDistance = worldConfig.radius * Const.CAMERA_MIN_DISTANCE_FACTOR;
  controls.maxDistance = worldConfig.radius * Const.CAMERA_MAX_DISTANCE_FACTOR;

  camera.position.set(
    0, 
    worldConfig.radius * Const.CAMERA_INITIAL_POS_Y_FACTOR, 
    worldConfig.radius * Const.CAMERA_INITIAL_POS_Z_FACTOR
  );
  controls.target.set(0, 0, 0);
  controls.update();
}

function setupEventListeners() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Raycasting for tile selection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (!planetGroup) return;
    const intersections = raycaster.intersectObject(planetGroup, true);
    if (intersections.length === 0) return;

    const intersect = intersections[0];
    
    // Skip outline objects and find the first terrain mesh
    let mainIntersect = intersect;
    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i].object.userData.isMainMesh) {
        mainIntersect = intersections[i];
        break;
      }
    }
    
    const point = mainIntersect.point.clone().sub(planetGroup.position); // relative to planet center
    const radius = worldConfig.radius;
    const normal = point.clone().normalize();

    // Latitude and longitude in degrees
    const lat = Math.asin(normal.y) * (180 / Math.PI);
    const lon = Math.atan2(normal.z, normal.x) * (180 / Math.PI);

    // Determine tileId first
    let tileId = null;
    const attr = mainIntersect.object.geometry.getAttribute('tileId');
    if (attr) {
      const idx = mainIntersect.faceIndex * 3; // first vertex of triangle
      tileId = attr.array[idx];
    }

    // Determine terrain using stored map if available
    let terrain = classifyTerrain(normal);
    if(mainIntersect.object.userData.tileTerrain){
      const mapTT = mainIntersect.object.userData.tileTerrain;
      if(tileId!=null && mapTT[tileId]) terrain = mapTT[tileId];
    }

    // Plate ID if available
    let plateId = null;
    if(mainIntersect.object.userData.tilePlate && tileId!=null){
      plateId = mainIntersect.object.userData.tilePlate[tileId];
    }

    // Highlight selected tile
    if(selectedHighlight){
       planetGroup.remove(selectedHighlight);
       if(selectedHighlight.geometry) selectedHighlight.geometry.dispose();
       selectedHighlight = null;
    }

    if(mainIntersect.object.userData.tileEdges && mainIntersect.object.userData.tileEdges[tileId]){
        const posArr = mainIntersect.object.userData.tileEdges[tileId];
        // Slightly scale outward to make it appear thicker
        const scaled = [];
        const scaleFactor = 1.003;
        for(let i=0;i<posArr.length;i+=3){
          const vx = posArr[i], vy = posArr[i+1], vz = posArr[i+2];
          const vec = new THREE.Vector3(vx, vy, vz).normalize().multiplyScalar(worldConfig.radius * scaleFactor);
          scaled.push(vec.x, vec.y, vec.z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(scaled,3));
        const mat = new THREE.LineBasicMaterial({color:0x0077ff, transparent:true, opacity:0.9});
        selectedHighlight = new THREE.LineSegments(geo, mat);
        selectedHighlight.userData.isHighlight = true;
        planetGroup.add(selectedHighlight);
    }

    const elevation = mainIntersect.object.userData.tileElevation ? mainIntersect.object.userData.tileElevation[tileId] : null;
    const moisture = mainIntersect.object.userData.tileMoisture ? mainIntersect.object.userData.tileMoisture[tileId] : null;

    debug(`Tile ${tileId} – Terr:${terrain} Plate:${plateId} Elev:${elevation?.toFixed(2)} Moist:${moisture?.toFixed(2)} Lat:${lat.toFixed(2)}° Lon:${lon.toFixed(2)}°`);

    // Update debug panel if present
    const statusDiv = document.getElementById('debug-status');
    if (statusDiv) {
      // Retrieve the clicked tile to get its area
      const clickedTileForUI = worldData.globe.getTile(tileId);
      const areaForUI = clickedTileForUI?.area !== undefined ? clickedTileForUI.area.toFixed(4) : 'N/A';
      statusDiv.innerHTML =
        `ID: ${tileId}<br>` +
        `Terr: ${terrain}<br>` +
        `Plate: ${plateId}<br>` +
        `Area: ${areaForUI}<br>` +
        `Elev: ${elevation?.toFixed(2)}<br>` +
        `Moist: ${moisture?.toFixed(2)}<br>` +
        `Lat: ${lat.toFixed(2)}°<br>` +
        `Lon: ${lon.toFixed(2)}°`;
    }

    const clickedTile = worldData.globe.getTile(tileId);

    if (clickedTile) {
      let debugMsg = `Tile clicked: ID=${clickedTile.id}, Terrain=${clickedTile.terrain.id}, Center=(${clickedTile.center.map(c=>c.toFixed(2))})`;
      if (clickedTile.neighbors) {
        debugMsg += `, Neighbors=[${clickedTile.neighbors.join(',')}]`;
      }
      if (clickedTile.area !== undefined) {
        debugMsg += `, Area=${clickedTile.area.toFixed(4)}`; // Display area
      }
      if (clickedTile.plateId !== null) {
        debugMsg += `, PlateID=${clickedTile.plateId}`;
      }
      debugMsg += `, Elevation=${clickedTile.elevation.toFixed(2)}, Moisture=${clickedTile.moisture.toFixed(2)}`;
      debug(debugMsg);
      // highlightTile(clickedTileId, mainIntersect.object); // Commented out due to ReferenceError
    } else {
      // ... existing code ...
    }
  });

  // Initialize new control modules
  // Pass necessary dependencies: camera, planetGroup, controls (OrbitControls), renderer, worldConfig
  // Ensure planetGroup and worldConfig are initialized before this call if accessed within init functions
  // It's safer to call these after planetGroup and worldConfig are definitely set up.
  // Let's assume they are available when setupEventListeners is called after generateAndDisplayPlanet and setupControls.
  
  initMouseControls(camera, planetGroup, controls, renderer);
  initKeyboardControls(camera, planetGroup, controls, worldConfig);

  // Mouse Panning Listeners - MOVED to mouseControls.js
  // renderer.domElement.addEventListener('mousedown', (event) => { ... });
  // document.addEventListener('mousemove', (event) => { ... });
  // document.addEventListener('mouseup', (event) => { ... });

  // Keyboard Navigation Listeners - MOVED to keyboardControls.js
  // document.addEventListener('keydown', (event) => { ... });
  // document.addEventListener('keyup', (event) => { ... });
}

function setupMouseTracking() {
  window.addEventListener('mousedown', () => { isMouseDown = true; });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('mouseleave', () => { isMouseDown = false; });
}

function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();

  handleKeyboardInput(); // Updates targetAngularVelocity (from keyboardControls.js)
  updatePlanetRotation(deltaTime); // Apply smooth rotation and damping
  updateComponentUIDisplay(camera, controls, planetGroup); // Update zoom and velocity display each frame

  if (controls && controls.enableDamping) {
    controls.update();
  }
  renderer.render(scene, camera);
}

export function updatePlanetColors() {
  if(!planetGroup) return;
  const mainMesh = planetGroup.children.find(c=>c.userData && c.userData.isMainMesh);
  if(!mainMesh) return;
  const colorsAttr = mainMesh.geometry.getAttribute('color');
  const tileIds = mainMesh.geometry.getAttribute('tileId');
  if(!colorsAttr || !tileIds) return;

  const tileTerrain = mainMesh.userData.tileTerrain || {};
  const tilePlate = mainMesh.userData.tilePlate || {};
  const plateColors = mainMesh.userData.plateColors || {};

  function hexToRgbArr(hex){
    return [ ((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255 ];
  }

  const terrainColorCache = {};
  Object.values(Terrains).forEach(t=>{ terrainColorCache[t.id] = [ ((t.color>>16)&255)/255, ((t.color>>8)&255)/255, (t.color&255)/255 ]; });

  function elevationRGB(val){
    const elev = val + sphereSettings.elevationBias;
    const stops=[1,0.8,0.6,0.4,0.2,0,-0.2,-0.4,-0.6,-0.8,-1];
    const hex=[0x641009,0x87331E,0xAB673D,0xD2A467,0xFAE29A,0xF1EBDA,0x2F62B9,0x1E3FB2,0x0D1BA1,0x0C0484,0x170162];
    for(let i=0;i<stops.length;i++){
      if(elev>=stops[i]){ const h=hex[i]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
    }
    const h=hex[hex.length-1]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  }

  function moistureRGB(val){
    const stops=[1,0.8,0.6,0.4,0.2,0];
    const hex=[0x75FB4C,0x7BD851,0x88B460,0x839169,0x6C6E65,0x6C6E65];
    for(let i=0;i<stops.length;i++){
      if(val>=stops[i]){ const h=hex[i]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255]; }
    }
    const h=hex[hex.length-1]; return [((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255];
  }

  for(let i=0;i<tileIds.count;i++){
    const tId = tileIds.array[i];
    let rgb;
    if(sphereSettings.viewMode==='plates'){
       const pid = tilePlate[tId];
       const hex = plateColors[pid] || 0xffffff;
       rgb = hexToRgbArr(hex);
    } else if(sphereSettings.viewMode==='elevation'){
       const elev = mainMesh.userData.tileElevation ? mainMesh.userData.tileElevation[tId] : 0;
       rgb = elevationRGB(elev);
    } else if(sphereSettings.viewMode==='moisture'){
       const moist = mainMesh.userData.tileMoisture ? mainMesh.userData.tileMoisture[tId] : 0;
       rgb = moistureRGB(moist);
    } else {
       const terr = tileTerrain[tId];
       rgb = terrainColorCache[terr] || [1,1,1];
    }
    colorsAttr.array[i*3] = rgb[0];
    colorsAttr.array[i*3+1] = rgb[1];
    colorsAttr.array[i*3+2] = rgb[2];
  }
  colorsAttr.needsUpdate = true;
}

// New function for smooth planet rotation
function updatePlanetRotation(deltaTime) {
  if (!planetGroup || !planetGroup.userData) return;

  const { angularVelocity, targetAngularVelocity, isBeingDragged } = planetGroup.userData;

  if (isBeingDragged) {
    // When mouse is dragging, rotation is handled directly by mouseControls.js
    // We just ensure angularVelocity is zeroed so it doesn't fight when drag ends.
    // angularVelocity should have been zeroed on mousedown by mouseControls.
    return;
  }

  // Smoothly interpolate current angular velocity towards target (driven by keyboard)
  angularVelocity.lerp(targetAngularVelocity, Const.KEYBOARD_ROTATION_ACCELERATION_FACTOR);

  // Apply damping
  angularVelocity.multiplyScalar(Math.pow(Const.GLOBE_ANGULAR_DAMPING_FACTOR, deltaTime * 60)); // Frame-rate independent damping

  // Stop rotation if speed is very low to prevent indefinite small drifts
  const minSpeed = 0.0001;
  if (angularVelocity.lengthSq() < minSpeed * minSpeed) {
    angularVelocity.set(0, 0, 0);
  }

  // Apply rotation based on current angular velocity
  if (angularVelocity.lengthSq() > 0) {
    // We need to rotate around each world axis by the component of angularVelocity for that axis.
    // This is a simplification. Proper quaternion integration would be more robust for complex rotations.
    if (Math.abs(angularVelocity.x) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(1,0,0), angularVelocity.x * deltaTime);
    }
    if (Math.abs(angularVelocity.y) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(0,1,0), angularVelocity.y * deltaTime);
    }
    if (Math.abs(angularVelocity.z) > minSpeed) {
        planetGroup.rotateOnWorldAxis(new THREE.Vector3(0,0,1), angularVelocity.z * deltaTime);
    }
    if (controls) controls.update(); // OrbitControls might need update if target moves (though planet moves here)
  }
}

// Add this new function to handle keyboard inputs - MOVED to keyboardControls.js
// function handleKeyboardInput() { ... } 
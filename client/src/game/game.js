import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// Import sphere settings and draw mode
import { sphereSettings, DrawMode, classifyTerrain } from './world/planetSphereVoronoi.js';
import { MapTypes, MapRegistry } from './world/registries/MapTypeRegistry.js';
import { Terrains } from './world/registries/TerrainRegistry.js';
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug } from './debug.js';

let scene, camera, renderer, controls;
let worldData; // Will store { meshGroup, cells, config } from generateWorld
let planetGroup; // This will be worldData.meshGroup
let worldConfig;
let isMouseDown = false;
let selectedHighlight = null;

export function initGame() {
  try {
    debug('Initializing game (fresh start)...');
    initDebug();
    
    setupThreeJS();
    setupWorldConfig();
    // Initialize controls before planet generation so sliders have correct values
    const pointsSlider = document.getElementById('points-slider');
    if (pointsSlider) {
      pointsSlider.max = sphereSettings.numPoints;
      updateControlValues(); // Set initial values without generating planet
    }
    generateAndDisplayPlanet(); 
    setupLighting();
    setupControls();
    setupEventListeners();
    setupSocketConnection();
    setupSphereControls();
    setupMouseTracking();
    animate();
    
    debug('Game initialized successfully (fresh start).');
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
  scene.background = new THREE.Color(0x0a0a2a);
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 25);
  camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function setupWorldConfig() {
  worldConfig = {
    radius: 10,
    detail: 2, 
  };
  debug('Initial worldConfig set:', worldConfig);
}

function generateAndDisplayPlanet() {
  try {
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

    updateControlValues();
    addPlanetaryGlow(worldConfig.radius);

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
  const glowGeometry = new THREE.SphereGeometry(radius * 1.15, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x5c95ff, transparent: true, opacity: 0.15, side: THREE.BackSide });
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
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = worldConfig.radius * 1.2;
  controls.maxDistance = worldConfig.radius * 5;
  camera.position.set(0, worldConfig.radius * 0.5, worldConfig.radius * 2.5);
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
      statusDiv.textContent = `ID:${tileId} Terr:${terrain} Plate:${plateId} Elev:${elevation?.toFixed(2)} Moist:${moisture?.toFixed(2)} Lat:${lat.toFixed(2)}° Lon:${lon.toFixed(2)}°`;
    }
  });
}

function setupSphereControls() {
  // Draw mode buttons
  document.getElementById('draw-points').addEventListener('click', () => {
    setActiveButton('draw-points', ['draw-delaunay', 'draw-voronoi', 'draw-centroid']);
    sphereSettings.drawMode = DrawMode.POINTS;
    generateAndDisplayPlanet();
  });
  
  document.getElementById('draw-delaunay').addEventListener('click', () => {
    setActiveButton('draw-delaunay', ['draw-points', 'draw-voronoi', 'draw-centroid']);
    sphereSettings.drawMode = DrawMode.DELAUNAY;
    generateAndDisplayPlanet();
  });
  
  document.getElementById('draw-voronoi').addEventListener('click', () => {
    setActiveButton('draw-voronoi', ['draw-points', 'draw-delaunay', 'draw-centroid']);
    sphereSettings.drawMode = DrawMode.VORONOI;
    generateAndDisplayPlanet();
  });
  
  document.getElementById('draw-centroid').addEventListener('click', () => {
    setActiveButton('draw-centroid', ['draw-points', 'draw-delaunay', 'draw-voronoi']);
    sphereSettings.drawMode = DrawMode.CENTROID;
    generateAndDisplayPlanet();
  });
  
  // Algorithm selection
  document.getElementById('algorithm-1').addEventListener('click', () => {
    setActiveButton('algorithm-1', ['algorithm-2']);
    sphereSettings.algorithm = 1;
    generateAndDisplayPlanet();
  });
  
  document.getElementById('algorithm-2').addEventListener('click', () => {
    setActiveButton('algorithm-2', ['algorithm-1']);
    sphereSettings.algorithm = 2;
    generateAndDisplayPlanet();
  });
  
  // Point count slider
  const pointsSlider = document.getElementById('points-slider');
  pointsSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('points-value').textContent = value;
  });
  
  pointsSlider.addEventListener('change', (e) => {
    sphereSettings.numPoints = parseInt(e.target.value);
    generateAndDisplayPlanet();
  });
  
  // Jitter slider
  const jitterSlider = document.getElementById('jitter-slider');
  jitterSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value).toFixed(2);
    document.getElementById('jitter-value').textContent = value;
  });
  
  jitterSlider.addEventListener('change', (e) => {
    sphereSettings.jitter = parseFloat(e.target.value);
    generateAndDisplayPlanet();
  });
  
  // Rotation slider
  const rotationSlider = document.getElementById('rotation-slider');
  rotationSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('rotation-value').textContent = value + '°';
  });
  
  rotationSlider.addEventListener('change', (e) => {
    sphereSettings.rotation = parseInt(e.target.value);
    generateAndDisplayPlanet();
  });
  
  // Radius (globe size) slider
  const radiusSlider = document.getElementById('radius-slider');
  radiusSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    document.getElementById('radius-value').textContent = value;
  });
  
  radiusSlider.addEventListener('change', (e) => {
    worldConfig.radius = parseInt(e.target.value);
    // Update OrbitControls distances and camera position to match new radius
    if (controls) {
      controls.minDistance = worldConfig.radius * 1.2;
      controls.maxDistance = worldConfig.radius * 5;
    }
    if (camera) {
      camera.position.set(0, worldConfig.radius * 0.5, worldConfig.radius * 2.5);
    }
    generateAndDisplayPlanet();
  });
  
  // Map type selector
  const mapTypeSelector = document.getElementById('map-type-selector');
  mapTypeSelector.addEventListener('change', (e) => {
    sphereSettings.mapType = e.target.value;
    
    // Update description text
    const description = MapRegistry[sphereSettings.mapType]?.description || '';
    document.getElementById('map-type-description').textContent = description;
    
    generateAndDisplayPlanet();
  });
  
  // Outline toggle
  const outlineToggle = document.getElementById('outline-toggle');
  outlineToggle.addEventListener('change', (e) => {
    sphereSettings.outlineVisible = e.target.checked;
    if(planetGroup){
        planetGroup.traverse(obj=>{
            if(obj.userData.isOutline){
                obj.visible = sphereSettings.outlineVisible;
            }
        });
    }
  });

  // Number of plates slider
  const platesSlider = document.getElementById('plates-slider');
  if(platesSlider){
    platesSlider.addEventListener('input', (e)=>{
      const val = parseInt(e.target.value);
      document.getElementById('plates-value').textContent = val;
    });
    platesSlider.addEventListener('change', (e)=>{
      sphereSettings.numPlates = parseInt(e.target.value);
      generateAndDisplayPlanet();
    });
  }

  // View selector (terrain vs plates)
  const viewSelector = document.getElementById('view-selector');
  if(viewSelector){
    viewSelector.addEventListener('change', (e)=>{
      sphereSettings.viewMode = e.target.value;
      updatePlanetColors();
    });
  }

  // Elevation bias slider
  const ebSlider = document.getElementById('elevbias-slider');
  if(ebSlider){
    ebSlider.addEventListener('input',(e)=>{
      const val=parseFloat(e.target.value);
      document.getElementById('elevbias-value').textContent=val.toFixed(2);
    });
    ebSlider.addEventListener('change',(e)=>{
      sphereSettings.elevationBias=parseFloat(e.target.value);
      if(sphereSettings.viewMode==='elevation'){
         updatePlanetColors();
      }
    });
  }
}

function setActiveButton(activeId, inactiveIds) {
  document.getElementById(activeId).classList.add('active');
  inactiveIds.forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
}

function updateControlValues() {
  // Update displayed values
  document.getElementById('points-value').textContent = sphereSettings.numPoints;
  document.getElementById('points-slider').value = sphereSettings.numPoints;
  
  document.getElementById('jitter-value').textContent = sphereSettings.jitter.toFixed(2);
  document.getElementById('jitter-slider').value = sphereSettings.jitter;
  
  document.getElementById('rotation-value').textContent = sphereSettings.rotation + '°';
  document.getElementById('rotation-slider').value = sphereSettings.rotation;
  
  document.getElementById('radius-value').textContent = worldConfig.radius;
  document.getElementById('radius-slider').value = worldConfig.radius;
  
  // Update map type selector
  document.getElementById('map-type-selector').value = sphereSettings.mapType;
  document.getElementById('map-type-description').textContent = 
    MapRegistry[sphereSettings.mapType]?.description || '';
  
  // Update active buttons
  setActiveButton(`draw-${sphereSettings.drawMode}`, 
    Object.values(DrawMode)
      .filter(mode => mode !== sphereSettings.drawMode)
      .map(mode => `draw-${mode}`)
  );
  
  setActiveButton(`algorithm-${sphereSettings.algorithm}`, 
    [sphereSettings.algorithm === 1 ? 'algorithm-2' : 'algorithm-1']
  );
  
  document.getElementById('outline-toggle').checked = sphereSettings.outlineVisible;

  if(document.getElementById('plates-slider')){
    document.getElementById('plates-slider').value = sphereSettings.numPlates;
    document.getElementById('plates-value').textContent = sphereSettings.numPlates;
  }

  if(document.getElementById('view-selector')){
    document.getElementById('view-selector').value = sphereSettings.viewMode;
  }

  if(document.getElementById('elevbias-slider')){
    document.getElementById('elevbias-slider').value = sphereSettings.elevationBias;
    document.getElementById('elevbias-value').textContent = sphereSettings.elevationBias.toFixed(2);
  }
}

function setupMouseTracking() {
  window.addEventListener('mousedown', () => { isMouseDown = true; });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('mouseleave', () => { isMouseDown = false; });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function updatePlanetColors() {
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
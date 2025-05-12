import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// Import sphere settings and draw mode
import { sphereSettings, DrawMode, classifyTerrain } from './world/planetSphereVoronoi.js';
import { MapType, mapTypeInfo } from './world/mapTypes.js';
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

    debug(`Tile clicked – ID: ${tileId}, Terrain: ${terrain}, Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`);

    // Update debug panel if present
    const statusDiv = document.getElementById('debug-status');
    if (statusDiv) {
      statusDiv.textContent = `ID: ${tileId}, Terrain: ${terrain}, Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`;
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
    const description = mapTypeInfo[sphereSettings.mapType]?.description || '';
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
    mapTypeInfo[sphereSettings.mapType]?.description || '';
  
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
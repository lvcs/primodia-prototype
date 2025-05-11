import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
// voronoiSphere.js is now an internal detail of worldGenerator.js
import { setupSocketConnection } from './multiplayer/socket.js';
import { debug, error, initDebug } from './debug.js';

let scene, camera, renderer, controls;
let worldData; // Will store { meshGroup, cells, config } from generateWorld
let planetGroup; // This will be worldData.meshGroup
let worldConfig;
let isMouseDown = false;

export function initGame() {
  try {
    debug('Initializing game (fresh start)...');
    initDebug();
    
    setupThreeJS();
    setupWorldConfig();
    generateAndDisplayPlanet(); 
    setupLighting();
    setupControls();
    setupEventListeners();
    setupSocketConnection();
    setupTileDensitySlider();
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

    updateTileCountDisplay();
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
}

function setupTileDensitySlider() {
  const slider = document.getElementById('hex-density-slider');
  if (!slider) return;
  slider.value = worldConfig.detail;
  updateTileCountDisplay(); 
  slider.addEventListener('input', (e) => {
    const newDetail = parseInt(e.target.value, 10);
    if (newDetail !== worldConfig.detail) {
      worldConfig.detail = newDetail;
      generateAndDisplayPlanet(); 
    }
  });
}

function updateTileCountDisplay() {
    let totalTiles = 0;
    if (worldData && worldData.cells && Array.isArray(worldData.cells)) {
      totalTiles = worldData.cells.length;
    }
    const densityValue = document.getElementById('hex-density-value');
    if (densityValue) {
      densityValue.textContent = `${worldConfig.detail} (${totalTiles} tiles)`;
    }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function setupMouseTracking() {
  window.addEventListener('mousedown', () => { isMouseDown = true; });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('mouseleave', () => { isMouseDown = false; });
} 
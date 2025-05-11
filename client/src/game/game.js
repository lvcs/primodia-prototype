import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateWorld } from './world/worldGenerator.js';
import { createHexSphere } from './world/hexSphere.js';
import { setupSocketConnection } from './multiplayer/socket.js';

let scene, camera, renderer, controls;
let world, hexGrid;

export function initGame() {
  setupThreeJS();
  setupWorld();
  setupLighting();
  setupControls();
  setupEventListeners();
  setupSocketConnection();
  animate();
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
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'),
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
}

function setupWorld() {
  // Game world configuration
  const worldConfig = {
    radius: 10,         // Planet radius
    detail: 3,          // Detail level (higher = more hexagons)
    hexSize: 1,         // Size of hexagons
    waterLevel: 0.3,    // Water level threshold (0-1)
    mountainLevel: 0.7  // Mountain level threshold (0-1)
  };
  
  // Generate world data
  world = generateWorld(worldConfig);
  
  // Create visual representation
  hexGrid = createHexSphere(world, scene);
}

function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  // Directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(10, 20, 10);
  sunLight.castShadow = true;
  scene.add(sunLight);
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
}

function setupEventListeners() {
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Handle hex tile selection
  renderer.domElement.addEventListener('click', onHexClick);
}

function onHexClick(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Raycaster for selecting hexes
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // Get all hex meshes from the scene
  const hexMeshes = scene.children.filter(child => 
    child.userData && child.userData.isHex
  );
  
  // Check for intersections
  const intersects = raycaster.intersectObjects(hexMeshes);
  
  if (intersects.length > 0) {
    const selectedHex = intersects[0].object;
    selectHex(selectedHex);
  }
}

function selectHex(hexMesh) {
  // Get the hex data from the mesh
  const hexData = hexMesh.userData.hexData;
  
  // Log hex data for debugging
  console.log('Selected hex:', hexData);
  
  // Highlight the selected hex
  hexMesh.material.emissive.setHex(0x555555);
  
  // TODO: Show hex information in UI
  // TODO: Handle game actions for the selected hex
}

function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.update();
  
  // Render scene
  renderer.render(scene, camera);
} 
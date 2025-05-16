// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Const from '@/config/gameConstants.js'; // Updated path
import { debug } from '@/game/utils/debug.js'; // Updated path

// Module-level variables for scene, camera, renderer, controls, and worldConfig
// These will be initialized by the functions in this module.
let scene, camera, renderer, controls;
let worldConfig;

export function setupThreeJS() {
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
  return { scene, camera, renderer }; // Return them so game.js can access them
}

export function setupInitialWorldConfig() { // Renamed to avoid conflict in game.js if it re-exports or uses it differently
  worldConfig = {
    radius: Const.GLOBE_RADIUS,
    detail: Const.DEFAULT_WORLD_DETAIL,
  };
  debug('Initial worldConfig set:', worldConfig);
  return worldConfig; // Return it
}

export function setupLighting(_scene) { // Accept scene as parameter
  const ambientLight = new THREE.AmbientLight(0x606080, 1);
  _scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(50, 50, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  _scene.add(sunLight);
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  _scene.add(hemisphereLight);
}

export function setupOrbitControls(_camera, _renderer, _worldConfig) { // Renamed to avoid conflict
  if (controls) {
    controls.dispose();
  }
  controls = new OrbitControls(_camera, _renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = _worldConfig.radius * Const.CAMERA_MIN_DISTANCE_FACTOR;
  controls.maxDistance = _worldConfig.radius * Const.CAMERA_MAX_DISTANCE_FACTOR;

  // Allow full rotation around the X-axis (polar angle)
  controls.minPolarAngle = 0; // Min angle from the zenith (Y-axis up)
  controls.maxPolarAngle = Math.PI; // Max angle from the zenith (Y-axis up)

  // Azimuthal rotation (around Y-axis) is unrestricted by default.
  // controls.minAzimuthAngle = -Infinity; // Default
  // controls.maxAzimuthAngle = Infinity;  // Default

  _camera.position.set(
    0,
    _worldConfig.radius * Const.CAMERA_INITIAL_POS_Y_FACTOR,
    _worldConfig.radius * Const.CAMERA_INITIAL_POS_Z_FACTOR
  );
  controls.target.set(0, 0, 0);
  controls.update();
  return controls; // Return the created controls
}

// Getter functions for other modules to access these core components if needed,
// without directly exposing the module-level variables.
export const getScene = () => scene;
export const getCamera = () => camera;
export const getRenderer = () => renderer;
export const getControls = () => controls;
export const getWorldConfig = () => worldConfig; 
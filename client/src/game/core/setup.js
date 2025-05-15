// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // REMOVED
import { CameraRig } from '@/camera/CameraRig.js'; // CORRECTED PATH using alias
import * as Const from '@/config/gameConstants.js'; // Updated path
import * as CamConfig from '@/camera/cameraConfig.js'; // ADDED for CameraRig initial distance
import { debug } from '@/game/utils/debug.js'; // Updated path

// Module-level variables for scene, camera, renderer, controls (now CameraRig), and worldConfig
let scene, camera, renderer, cameraRig; // CHANGED controls to cameraRig
let worldConfig;

export function setupThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(Const.SCENE_BACKGROUND_COLOR);
  camera = new THREE.PerspectiveCamera(Const.CAMERA_FOV, window.innerWidth / window.innerHeight, Const.CAMERA_NEAR_PLANE, Const.CAMERA_FAR_PLANE);
  // Initial camera position is now set by CameraRig itself based on its own config.
  // camera.position.set(0, 0, 25); // This will be handled by CameraRig
  // camera.lookAt(0, 0, 0); // This will be handled by CameraRig
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

// ADDED function to setup CameraRig
export function setupCameraSystem(_camera, _scene, _worldConfig) {
  if (cameraRig) {
    // If there's a way to dispose of CameraRig (e.g., remove its group from scene),
    // do it here. For now, assume it's fresh or re-assignable.
    // cameraRig.dispose(); 
  }
  // CameraRig constructor takes: threeJsCamera, scene, globeRadius
  cameraRig = new CameraRig(_camera, _scene, _worldConfig.radius);
  // Initial position/orientation is handled within CameraRig constructor using CamConfig constants.
  return cameraRig;
}

// Getter functions for other modules to access these core components if needed,
// without directly exposing the module-level variables.
export const getScene = () => scene;
export const getCamera = () => camera;
export const getRenderer = () => renderer;
// export const getControls = () => controls; // OLD getter for OrbitControls
export const getCameraRig = () => cameraRig; // NEW getter for CameraRig
export const getWorldConfig = () => worldConfig; 
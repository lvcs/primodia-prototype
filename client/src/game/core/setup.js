// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
// OrbitControls is now managed by camera.js
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import * as ConstFromGameConfig from '../../config/gameConfig.js'; 
// GLOBE_VIEW_CAMERA_DISTANCE might be sourced from cameraStore defaults now via camera
// import { GLOBE_VIEW_CAMERA_DISTANCE } from '../../config/cameraConfig.js'; 
import { debug } from '../utils/debug.js'; 
import { initializeCameraSystem } from '../camera/camera.js'; // Import the new camera system initializer

let scene, camera, renderer, controls;
let worldConfig;

export function setupThreeJS(canvasElement, _worldConfig) { // Pass worldConfig for camera system
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  if (!_worldConfig) {
    throw new Error("setupThreeJS requires a worldConfig argument for camera initialization.");
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(ConstFromGameConfig.SCENE_BACKGROUND_COLOR);
  
  // Initialize camera and controls using the new camera system
  const cameraSystem = initializeCameraSystem(canvasElement, _worldConfig);
  camera = cameraSystem.camera;
  controls = cameraSystem.controls;
  
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight); 
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return { scene, camera, renderer, controls }; // Return controls as well
}

export function setupInitialWorldConfig() {
  worldConfig = {
    radius: ConstFromGameConfig.GLOBE_RADIUS,
    detail: ConstFromGameConfig.DEFAULT_WORLD_DETAIL,
  };
  debug('Initial worldConfig set:', worldConfig);
  return worldConfig;
}

export function setupLighting(_scene) {
  const ambientLight = new THREE.AmbientLight(0x606080, 1);
  _scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(20000, 20000, 20000);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  _scene.add(sunLight);
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  _scene.add(hemisphereLight);
}

// setupOrbitControls is now part of initializeCameraSystem in camera.js
/*
export function setupOrbitControls(_camera, _renderer, _worldConfig) {
  if (controls) {
    controls.dispose();
  }
  controls = new OrbitControls(_camera, _renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = _worldConfig.radius * ConstFromGameConfig.CAMERA_MIN_DISTANCE_FACTOR;
  controls.maxDistance = _worldConfig.radius * ConstFromGameConfig.CAMERA_MAX_DISTANCE_FACTOR;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;

  _camera.position.set(
    0,
    _worldConfig.radius * ConstFromGameConfig.CAMERA_INITIAL_POS_Y_FACTOR,
    _worldConfig.radius * ConstFromGameConfig.CAMERA_INITIAL_POS_Z_FACTOR
  );
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}
*/

export const getScene = () => scene;
export const getCamera = () => camera; // This will now return the camera managed by camera
export const getRenderer = () => renderer;
export const getControls = () => controls; // This will now return the controls managed by camera
export const getWorldConfig = () => worldConfig; 
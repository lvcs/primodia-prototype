// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
import * as ConstFromGameConfig from '../../config/gameConfig.js'; // Renamed to avoid conflict
import { debug } from '../utils/debug.js';
import { initializeCameraSystem, getCameraInstance, getControlsInstance } from '../camera/cameraSystem.js';

let scene, renderer, worldConfig;
let cameraSystem = { camera: null, controls: null };

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  scene = new THREE.Scene();
  scene.background = new THREE.Color(ConstFromGameConfig.SCENE_BACKGROUND_COLOR);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Initialize world config before camera setup
  worldConfig = setupInitialWorldConfig();
  
  // Initialize camera system
  cameraSystem = initializeCameraSystem(canvasElement, worldConfig);
  
  return { 
    scene, 
    camera: cameraSystem.camera, 
    renderer 
  };
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

export const getScene = () => scene;
export const getCamera = () => getCameraInstance();
export const getRenderer = () => renderer;
export const getControls = () => getControlsInstance();
export const getWorldConfig = () => worldConfig; 
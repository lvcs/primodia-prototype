// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Adjust path for Const if it moves to client/src/config
import * as ConstFromGameConfig from '../../config/gameConfig.js'; // Renamed to avoid conflict
import { GLOBE_VIEW_CAMERA_DISTANCE } from '../../config/cameraConfig.js'; // Import specific constant
// Adjust path for debug if it moves
import { debug } from '../utils/debug.js'; 

let scene, camera, renderer, controls;
let worldConfig;

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  scene = new THREE.Scene();
  scene.background = new THREE.Color(ConstFromGameConfig.SCENE_BACKGROUND_COLOR);
  
  // Use canvas dimensions for aspect ratio initially, but it should adapt on resize
  const aspectRatio = canvasElement.clientWidth / canvasElement.clientHeight;
  camera = new THREE.PerspectiveCamera(ConstFromGameConfig.CAMERA_FOV, aspectRatio, ConstFromGameConfig.CAMERA_NEAR_PLANE, ConstFromGameConfig.CAMERA_FAR_PLANE);
  camera.position.set(0, 0, GLOBE_VIEW_CAMERA_DISTANCE); // Use the constant for Z distance
  camera.lookAt(0, 0, 0);
  
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight); // Use canvas size
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Resizing should be handled by an event listener in the game setup or main loop,
  // updating camera aspect and renderer size.
  return { scene, camera, renderer };
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

export const getScene = () => scene;
export const getCamera = () => camera;
export const getRenderer = () => renderer;
export const getControls = () => controls;
export const getWorldConfig = () => worldConfig; 
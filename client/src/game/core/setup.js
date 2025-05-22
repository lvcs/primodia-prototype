// Three.js scene, camera, renderer, lighting, and initial controls setup 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Adjust path for Const if it moves to client/src/config
import * as Const from '../../config/gameConstants.js'; 
// Adjust path for debug if it moves
import { debug } from '../utils/debug.js'; 
import { initializeCam } from '@game/camera/cam.js';
import { useCameraStore } from '@stores';

let scene, camera, renderer, controls;
let worldConfig;

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  scene = new THREE.Scene();
  scene.background = new THREE.Color(Const.SCENE_BACKGROUND_COLOR);
  
  // Use canvas dimensions for aspect ratio initially, but it should adapt on resize
  const aspectRatio = canvasElement.clientWidth / canvasElement.clientHeight;
  initializeCam({aspectRatio: aspectRatio});
  camera = useCameraStore.getState().camera;
  
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
    radius: Const.GLOBE_RADIUS,
    detail: Const.DEFAULT_WORLD_DETAIL,
  };
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

  controls = new OrbitControls(_camera, _renderer.domElement);
  useCameraStore.setState({orbitControls: controls});
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = _worldConfig.radius * Const.CAMERA_MIN_DISTANCE_FACTOR;
  controls.maxDistance = _worldConfig.radius * Const.CAMERA_MAX_DISTANCE_FACTOR;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;

  _camera.position.set(
    0,
    0,
    _worldConfig.radius * Const.CAMERA_INITIAL_POS_Z_FACTOR
  );
  
  controls.update();
  controls.addEventListener('change', () => {
    // console.log('Camera has changed'); 
    console.log(useCameraStore.getState().camera.position);
    // const x = useCameraStore.getState().camera.position.x;
    // const y = useCameraStore.getState().camera.position.y;
    // const z = useCameraStore.getState().camera.position.z;
    const tempCamera = _camera;;
    // tempCamera.position.x = x;
    // tempCamera.position.y = y;
    // tempCamera.position.z = z;
    useCameraStore.getState().setCamera(tempCamera);

  });
  return controls;
}

export const getScene = () => scene;
export const getRenderer = () => renderer;
export const getControls = () => controls;
export const getWorldConfig = () => worldConfig; 
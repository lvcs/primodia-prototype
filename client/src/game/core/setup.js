import * as THREE from 'three';
import * as ConstFromGameConfig from '@config/gameConfig.js';
import { setupCosmos } from '@game/cosmos/cosmos.js';
import { initializeCam } from '@game/camera/';
import { useCameraStore } from '@stores';

let cosmos, camera, renderer;
let worldConfig;

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  cosmos = setupCosmos();
  
  // Use canvas dimensions for aspect ratio initially, but it should adapt on resize
  const aspectRatio = canvasElement.clientWidth / canvasElement.clientHeight;
  camera = initializeCam({aspectRatio: aspectRatio});
  
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight); // Use canvas size
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Resizing should be handled by an event listener in the game setup or main loop,
  // updating camera aspect and renderer size.
  return { cosmos, camera, renderer };
}

export function setupInitialWorldConfig() {
  worldConfig = {
    radius: ConstFromGameConfig.PLANET_RADIUS,
    detail: ConstFromGameConfig.DEFAULT_WORLD_DETAIL,
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
  const hemiplanetLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  _scene.add(hemiplanetLight);
}


export const getScene = () => cosmos;
export const getRenderer = () => renderer;
export const getControls = () => useCameraStore.getState().orbitControls;
export const getWorldConfig = () => worldConfig; 
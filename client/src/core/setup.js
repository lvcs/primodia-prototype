import * as THREE from 'three';
import { PLANET_RADIUS, WORLD_DETAIL_DEFAULT } from '@config';
import { setupScene } from '@game/scene';
import { initializeCam } from '@game/camera/';
import { useCameraStore, useSceneStore } from '@stores';

let scene, camera, renderer;
let worldConfig;

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  scene = setupScene();
  
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
  return { scene, camera, renderer };
}

export function setupInitialWorldConfig() {
  worldConfig = {
    radius: PLANET_RADIUS,
    detail: WORLD_DETAIL_DEFAULT,
  };
  return worldConfig;
}

export function setupLighting() {
  const scene = useSceneStore.getState().getScene();
  const ambientLight = new THREE.AmbientLight(0x606080, 1);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(20000, 20000, 20000);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);
  const hemiplanetLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  scene.add(hemiplanetLight);
}


export const getRenderer = () => renderer;
export const getControls = () => useCameraStore.getState().orbitControls;
export const getWorldConfig = () => worldConfig; 
import * as THREE from 'three';
import { setupScene } from '@game/scene';
import { initializeCam } from '@game/camera/';
import { useCameraStore, useSceneStore } from '@stores';

let camera, renderer;

export function setupThreeJS(canvasElement) {
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvasElement argument.");
  }
  const scene = setupScene();
  
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
  return { renderer };
}

export const getRenderer = () => renderer;
export const getControls = () => useCameraStore.getState().orbitControls;
import { WebGLRenderer, PCFSoftShadowMap } from 'three';
import { setupScene } from '@game/scene';
import { initializeCam } from '@game/camera/';
import { useRenderStore } from '@stores';

let camera;

export function setupThreeJS() {
  const { setRenderer, getCanvas } = useRenderStore.getState();

  const canvasElement = getCanvas();
  if (!canvasElement) {
    throw new Error("setupThreeJS requires a canvas to be set in the render store.");
  }
  const scene = setupScene();
  
  // Use canvas dimensions for aspect ratio initially, but it should adapt on resize
  const aspectRatio = canvasElement.clientWidth / canvasElement.clientHeight;
  camera = initializeCam({aspectRatio: aspectRatio});
  
  const renderer = new WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true });
  renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight); // Use canvas size
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  
  setRenderer(renderer);
}

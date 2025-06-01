import * as THREE from 'three';
import { WebGLRenderer, PCFSoftShadowMap } from 'three';
import { setupScene } from '@game/scene';
import { initializeCamera } from '@game/camera';
import { handleKeyboardInput } from '@game/keyboard'; 
import { useCameraStore, useSceneStore, useRenderStore } from '@stores';
import { setupCanvasResize, cleanupCanvasResize } from './canvasResize';

// Animation loop state
const clock = new THREE.Clock();
let animationFrameId = null;

// Animation loop function
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    const { camera, orbitControls } = useCameraStore.getState();
    const renderer = useRenderStore.getState().getRenderer();
    const scene = useSceneStore.getState().getScene();

    if (!camera || !renderer || !scene || !orbitControls) return;

    handleKeyboardInput(deltaTime);
    orbitControls.update();
    renderer.render(scene, camera);
}

// Three.js setup function
export function setupRenderer() {
  const { setRenderer, getCanvas } = useRenderStore.getState();

  const canvas = getCanvas();
  if (!canvas) {
    throw new Error("setupRenderer requires a canvas to be set in the render store.");
  }
  
  setupScene();
  initializeCamera();
  
  const renderer = new WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true 
  });
  
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  
  setRenderer(renderer);
  setupCanvasResize();
}

// Animation loop control functions
export function startAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animate();
}

export function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        clock.stop();
    }
}

// Export canvas resize utilities
export { cleanupCanvasResize }; 
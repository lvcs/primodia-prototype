import * as THREE from 'three';
import { WebGLRenderer, PCFSoftShadowMap } from 'three';
import { setupScene } from '@game/scene';
import { initializeCam } from '@game/camera/';
import { handleKeyboardInput } from '@game/keyboard'; 
import { useCameraStore, useSceneStore, useRenderStore } from '@stores';

// Animation loop state
const clock = new THREE.Clock();
let animationFrameId = null;

// Setup state
let camera;

// Animation loop function
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    const camera = useCameraStore.getState().camera;
    const renderer = useRenderStore.getState().getRenderer();
    const scene = useSceneStore.getState().getScene();
    const controls = useCameraStore.getState().orbitControls;

    if (!camera || !renderer || !scene || !controls) {
        return;
    }

    handleKeyboardInput(deltaTime);
    
    controls.update(); // OrbitControls.update() is required when enableDamping is true
    renderer.render(scene, camera);
}

// Three.js setup function
export function setupRenderer() {
  const { setRenderer, getCanvas } = useRenderStore.getState();

  const canvas = getCanvas();
  if (!canvas) {
    throw new Error("setupRenderer requires a canvas to be set in the render store.");
  }
  const scene = setupScene();
  
  // Use canvas dimensions for aspect ratio initially, but it should adapt on resize
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  camera = initializeCam({aspectRatio: aspectRatio});
  
  const renderer = new WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight); // Use canvas size
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  
  setRenderer(renderer);
}

// Animation loop control functions
export function startAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // clock.start(); // Ensure clock is started/reset before new loop
    animate();
}

export function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        clock.stop();
    }
} 
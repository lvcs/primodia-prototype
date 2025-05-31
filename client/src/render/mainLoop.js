import * as THREE from 'three';
import { handleKeyboardInput } from '@game/keyboard'; 
import { getRenderer } from './setup.js'; 
import { useCameraStore, useSceneStore } from '@stores';


const clock = new THREE.Clock();
let animationFrameId = null;

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    const camera = useCameraStore.getState().camera;
    const renderer = getRenderer();
    const scene = useSceneStore.getState().getScene();
    const controls = useCameraStore.getState().orbitControls;

    if (!camera || !renderer || !scene || !controls) {
        return;
    }

    handleKeyboardInput(deltaTime);
    
    if (controls.enableDamping) {
        controls.update(deltaTime); // Pass deltaTime to controls.update if it supports it (some versions do)
    }
    renderer.render(scene, camera);
}

export function startAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    clock.start(); // Ensure clock is started/reset before new loop
    animate();
}

export function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        clock.stop();
    }
} 
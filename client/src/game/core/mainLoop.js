// Main animation loop (animate function and clock) 
import * as THREE from 'three';
import { handleKeyboardInput } from '@/game/controls/keyboardControls.js'; // Path updated
import { updatePlanetRotation, getPlanetGroup } from '@/game/planet.js'; // Path updated
import { updateUIDisplay as updateComponentUIDisplay } from '@/ui/components/ZoomControls.js'; // Path is already correct relative to core/
import { getCamera, getRenderer, getScene, getControls } from './setup.js'; // Path updated (now sibling in core/)

const clock = new THREE.Clock();
let animationFrameId = null; // To potentially stop the loop if needed

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    // Get current state/objects via getters
    const camera = getCamera();
    const renderer = getRenderer();
    const scene = getScene();
    const controls = getControls(); // OrbitControls
    const planetGroup = getPlanetGroup();

    // Ensure all critical components are available
    if (!camera || !renderer || !scene || !controls || !planetGroup) {
        // console.error("Animation loop: Missing critical components.");
        // Consider stopping the loop or logging less frequently if this occurs often
        return;
    }

    handleKeyboardInput(); // From keyboardControls.js
    updatePlanetRotation(deltaTime, controls); // Pass OrbitControls for its potential update
    updateComponentUIDisplay(camera, controls, planetGroup);

    if (controls.enableDamping) {
        controls.update();
    }
    renderer.render(scene, camera);
}

export function startAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animate(); // Start the loop
}

// Optional: function to stop the animation loop
export function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
} 
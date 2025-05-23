import * as THREE from 'three';
// Adjust path for keyboardControls.js
import { handleKeyboardInput } from '@game/controls/keyboardControls.js'; 
// Adjust path for planet.js
import { getPlanetGroup, getWorldData } from '@game/planet.js'; 
// updateComponentUIDisplay from old CameraControlsSection is obsolete with React UI
import { getRenderer, getScene, getControls } from './setup.js'; 
import { useCameraStore } from '@stores';

// Import the new debug store for updating debug info from the main loop
import { useDebugStore } from '@stores';

const clock = new THREE.Clock();
let animationFrameId = null;

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    const camera = useCameraStore.getState().camera;
    const renderer = getRenderer();
    const scene = getScene();
    const controls = getControls();
    const planetGroup = getPlanetGroup();

    if (!camera || !renderer || !scene || !controls || !planetGroup) {
        return;
    }

    handleKeyboardInput(deltaTime);
    
    if (planetGroup && planetGroup.userData) { // Check userData exists
        const rotationDeg = {
            x: THREE.MathUtils.radToDeg(planetGroup.rotation.x).toFixed(2),
            y: THREE.MathUtils.radToDeg(planetGroup.rotation.y).toFixed(2),
            z: THREE.MathUtils.radToDeg(planetGroup.rotation.z).toFixed(2)
        };
        
        let targetAngularVelocity = { x: 'N/A', y: 'N/A', z: 'N/A' };
        if (planetGroup.userData.targetAngularVelocity) {
            targetAngularVelocity = {
                x: planetGroup.userData.targetAngularVelocity.x.toFixed(4),
                y: planetGroup.userData.targetAngularVelocity.y.toFixed(4),
                z: planetGroup.userData.targetAngularVelocity.z.toFixed(4)
            };
        }

        const globeDebugData = {

        };
        
        useDebugStore.getState().setGlobeDebugInfo(globeDebugData); // Update store directly
    }

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
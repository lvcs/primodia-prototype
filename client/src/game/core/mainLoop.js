import * as THREE from 'three';
// Adjust path for keyboardControls.js
import { handleKeyboardInput } from '@game/controls/keyboardControls.js'; 
// Adjust path for planet.js
import { getPlanetGroup, getWorldData } from '@game/planet.js'; 
// updateComponentUIDisplay from old CameraControlsSection is obsolete with React UI
// import { updateCameraControlsUI as updateComponentUIDisplay } from '@/ui/components/CameraControlsSection.js'; 
// Adjust path for debug.js and ensure its update... functions are safe (console.log or store update)
import { updateCameraDebugInfo, updateGlobeDebugInfo } from '@game/utils/debug.js';
// Adjust path for planetSphereVoronoi.js
import { sphereSettings } from '@game/world/planetSphereVoronoi.js';
// Imports from ./setup.js are correct as it's a sibling
import { getCamera, getRenderer, getScene, getControls } from './setup.js'; 
// Adjust path for gameConstants.js
import * as Const from '@config/gameConstants.js';

// Import the new debug store for updating debug info from the main loop
import { useDebugStore } from '@stores';

const clock = new THREE.Clock();
let animationFrameId = null;

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    const camera = getCamera();
    const renderer = getRenderer();
    const scene = getScene();
    const controls = getControls();
    const planetGroup = getPlanetGroup();

    if (!camera || !renderer || !scene || !controls || !planetGroup) {
        return;
    }

    handleKeyboardInput(deltaTime);
    // updateComponentUIDisplay(); // Obsolete: Old UI component update

    // Update camera debug info via store if necessary, or rely on CameraDebugTab subscribing to cameraUIStore
    // For now, let's assume CameraDebugTab gets its primary data from cameraUIStore or directly.
    // If specific derived data from this loop is needed, it can update useDebugStore.cameraDebugInfo
    // updateCameraDebugInfo(camera, controls); // Calls the neutered debug.js version (console.logs)
    // Example: useDebugStore.getState().setCameraDebugInfo({ customLoopData: 'value' });

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
            rotation: `CurrentRotationDeg: ${JSON.stringify(rotationDeg)}<br/>TargetAngularVelocity: ${JSON.stringify(targetAngularVelocity)}<br/>AngularDamping: ${Const.GLOBE_ANGULAR_DAMPING_FACTOR}`,
            // If individual slider values for rotation are needed in debugStore:
            // rotationX: planetGroup.rotation.x,
            // rotationY: planetGroup.rotation.y,
            // rotationZ: planetGroup.rotation.z
        };
        // updateGlobeDebugInfo(planetGroup, globeDebugData); // Calls the neutered debug.js version
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
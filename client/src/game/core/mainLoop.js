// Main animation loop (animate function and clock) 
import * as THREE from 'three';
import { handleKeyboardInput } from '@/game/controls/keyboardControls.js'; // Path updated
import { updatePlanetRotation, getPlanetGroup, getWorldData } from '@/game/planet.js'; // Path updated, added getWorldData
import { updateCameraControlsUI as updateComponentUIDisplay } from '@/ui/components/CameraControlsSection.js'; // New import
import { updateCameraDebugInfo, updateGlobeDebugInfo } from '@/game/utils/debug.js';
import { sphereSettings } from '@/game/world/planetSphereVoronoi.js';
import { getCamera, getRenderer, getScene, getControls } from './setup.js'; // Path updated (now sibling in core/)
import * as Const from '@/config/gameConstants.js';

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
    updateComponentUIDisplay(); // New parameter-less signature

    // Update camera debug info if the tab is active (the function itself checks for visibility)
    if (camera && controls) {
        updateCameraDebugInfo(camera, controls);
    }

    // Update globe debug info with rotation
    if (planetGroup) {
        const rotationDeg = {
            x: THREE.MathUtils.radToDeg(planetGroup.rotation.x).toFixed(2),
            y: THREE.MathUtils.radToDeg(planetGroup.rotation.y).toFixed(2),
            z: THREE.MathUtils.radToDeg(planetGroup.rotation.z).toFixed(2)
        };
        
        let targetAngularVelocity = { x: 'N/A', y: 'N/A', z: 'N/A' };
        if (planetGroup.userData && planetGroup.userData.targetAngularVelocity) {
            targetAngularVelocity = {
                x: planetGroup.userData.targetAngularVelocity.x.toFixed(4),
                y: planetGroup.userData.targetAngularVelocity.y.toFixed(4),
                z: planetGroup.userData.targetAngularVelocity.z.toFixed(4)
            };
        }

        const globeDebugData = {
            CurrentRotationDeg: rotationDeg,
            TargetAngularVelocity: targetAngularVelocity,
            AngularDamping: Const.GLOBE_ANGULAR_DAMPING_FACTOR
        };
        updateGlobeDebugInfo(planetGroup, globeDebugData);
    }

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
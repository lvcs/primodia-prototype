import * as THREE from 'three';
import {
  PLANET_RADIUS,
  PLANET_GLOW_RADIUS_FACTOR,
  PLANET_GLOW_COLOR,
  PLANET_GLOW_OPACITY
} from '@config';
import { useSceneStore } from '@stores';

export function createHemosphere() {
  const scene = useSceneStore.getState().getScene();
  const glowGeometry = new THREE.SphereGeometry(PLANET_RADIUS * PLANET_GLOW_RADIUS_FACTOR, 64, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: PLANET_GLOW_COLOR, 
    transparent: true, 
    opacity: PLANET_GLOW_OPACITY, 
    side: THREE.BackSide 
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.userData.isGlow = true;
  scene.add(glowMesh);
}

export function removeHemosphere() {
  const scene = useSceneStore.getState().getScene();
  const oldGlowMesh = scene.children.find(child => child.userData && child.userData.isGlow);
  if (oldGlowMesh) {
    scene.remove(oldGlowMesh);
    if (oldGlowMesh.geometry) oldGlowMesh.geometry.dispose();
    if (oldGlowMesh.material) oldGlowMesh.material.dispose();
  }
}

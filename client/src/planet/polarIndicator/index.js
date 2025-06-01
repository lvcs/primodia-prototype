import * as THREE from 'three';
import { PLANET_RADIUS } from '@config';
import {
  POLAR_INDICATOR_HEIGHT,
  POLAR_INDICATOR_RADIUS,
  POLAR_INDICATOR_OFFSET,
  POLAR_INDICATOR_SEGMENTS,
  POLAR_INDICATOR_NORTH_COLOR,
  POLAR_INDICATOR_SOUTH_COLOR
} from './polarIndicatorConfig.js';

/**
 * Creates polar indicator markers for north and south poles
 * @returns {Object} Object containing north and south pole markers
 */
export function createPolarIndicators() {
  const poleGeometry = new THREE.CylinderGeometry(
    POLAR_INDICATOR_RADIUS, 
    POLAR_INDICATOR_RADIUS, 
    POLAR_INDICATOR_HEIGHT, 
    POLAR_INDICATOR_SEGMENTS
  );
  
  // North pole marker (blue)
  const northPoleMaterial = new THREE.MeshBasicMaterial({ color: POLAR_INDICATOR_NORTH_COLOR });
  const northPoleMarker = new THREE.Mesh(poleGeometry, northPoleMaterial);
  northPoleMarker.position.y = PLANET_RADIUS + POLAR_INDICATOR_OFFSET + (POLAR_INDICATOR_HEIGHT / 2);
  
  // South pole marker (red)
  const southPoleMaterial = new THREE.MeshBasicMaterial({ color: POLAR_INDICATOR_SOUTH_COLOR });
  const southPoleMarker = new THREE.Mesh(poleGeometry, southPoleMaterial);
  southPoleMarker.position.y = -(PLANET_RADIUS + POLAR_INDICATOR_OFFSET + (POLAR_INDICATOR_HEIGHT / 2));
  
  return {
    northPoleMarker,
    southPoleMarker,
    geometry: poleGeometry // Return geometry for cleanup
  };
}

/**
 * Adds polar indicators to a planet group
 * @param {THREE.Group} planetGroup - The planet group to add indicators to
 * @returns {Object} The created polar indicators for reference
 */
export function addPolarIndicators(planetGroup) {
  const polarIndicators = createPolarIndicators();
  
  planetGroup.add(polarIndicators.northPoleMarker);
  planetGroup.add(polarIndicators.southPoleMarker);
  
  return polarIndicators;
}

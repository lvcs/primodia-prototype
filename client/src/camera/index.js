import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {
  CAMERA_FOV,
  CAMERA_NEAR_PLANE,
  CAMERA_FAR_PLANE,
  CAMERA_MIN_DISTANCE_FACTOR,
  CAMERA_MAX_DISTANCE_FACTOR,
  CAMERA_ZOOM_DISTANCE_DEFAULT,
  PLANET_RADIUS,
} from '@config'; 
import { useCameraStore, useRenderStore } from '@stores';


export const calculateSphericalCoords = (posX, posY, posZ) => {
  const distance = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
  if (distance === 0) {
    return { distance: 0, longitude: 0, latitude: 0 };
  }
  const longitude = Math.atan2(posY, posX) * (180 / Math.PI);
  // Calculate latitude as the elevation angle from the XY plane
  const latitude = Math.atan2(posZ, Math.sqrt(posX * posX + posY * posY)) * (180 / Math.PI);
  return { latitude, longitude, distance };
};


export const initializeCam = ({aspectRatio}) => {
  let camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE);
  console.log(camera.getWorldDirection(new THREE.Vector3(0,0,1)) );
  
  useCameraStore.getState().setCamera(camera);
  console.log(useCameraStore.getState().camera);
  window.camera = useCameraStore.getState();

  return useCameraStore.getState().camera;
}


export const setupOrbitControls = () => {
  let camera = useCameraStore.getState().camera;
  let renderer = useRenderStore.getState().getRenderer();
  
  if (!renderer) {
            throw new Error('Renderer not found in render store. Make sure setupRenderer is called first.');
  }
  
  let orbitControls = new OrbitControls(camera, renderer.domElement);
  // console.log(orbitControls);

  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.125;
  orbitControls.enablePan = true;
  orbitControls.minDistance = PLANET_RADIUS * CAMERA_MIN_DISTANCE_FACTOR;
  orbitControls.maxDistance = PLANET_RADIUS * CAMERA_MAX_DISTANCE_FACTOR;
  orbitControls.minPolarAngle = 0;
  orbitControls.maxPolarAngle = Math.PI;

  camera.position.set(
    0,
    0,
    CAMERA_ZOOM_DISTANCE_DEFAULT
  );
  
  orbitControls.update();
  orbitControls.addEventListener('change', () => {
    // console.log(useCameraStore.getState().camera);
    const tempCamera = camera;
    useCameraStore.getState().setCamera(tempCamera);
  });

  useCameraStore.getState().setOrbitControls(orbitControls);
  window.orbitControls = orbitControls;
  // return useCameraStore.getState().orbitControls;
}
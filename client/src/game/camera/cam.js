import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as Const from '@config/gameConstants.js'; 
import { useCameraStore } from '@stores';


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
  let camera = new THREE.PerspectiveCamera(Const.CAMERA_FOV, aspectRatio, Const.CAMERA_NEAR_PLANE, Const.CAMERA_FAR_PLANE);
  console.log(camera.getWorldDirection(new THREE.Vector3(0,0,1)) );
  
  useCameraStore.getState().setCamera(camera);
  console.log(useCameraStore.getState().camera);
  window.camera = useCameraStore.getState();
}


export const newsetupOrbitControls = (_renderer) => {
  let camera = useCameraStore.getState().camera;
  let orbitControls = new OrbitControls(camera, _renderer.domElement);
  // console.log(orbitControls);

  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.125;
  orbitControls.enablePan = true;
  orbitControls.minDistance = Const.GLOBE_RADIUS * Const.CAMERA_MIN_DISTANCE_FACTOR;
  orbitControls.maxDistance = Const.GLOBE_RADIUS * Const.CAMERA_MAX_DISTANCE_FACTOR;
  orbitControls.minPolarAngle = 0;
  orbitControls.maxPolarAngle = Math.PI;

  camera.position.set(
    0,
    0,
    Const.GLOBE_RADIUS * Const.CAMERA_INITIAL_POS_Z_FACTOR
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
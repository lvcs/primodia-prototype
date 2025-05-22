import * as THREE from 'three';
import * as Const from '../../config/gameConstants.js'; 
import { useCameraStore } from '@stores';


export const initializeCam = ({aspectRatio}) => {
  let camera = new THREE.PerspectiveCamera(Const.CAMERA_FOV, aspectRatio, Const.CAMERA_NEAR_PLANE, Const.CAMERA_FAR_PLANE);
  
  useCameraStore.getState().setCamera(camera);
  console.log(useCameraStore.getState().camera);
  window.camera = useCameraStore.getState();
}

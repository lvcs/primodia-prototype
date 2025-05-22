import React, { useState, useEffect } from 'react';

import * as Const from '../../config/gameConstants.js'; 

import { calculateSphericalCoords } from '@game/camera/cam.js';
import { useCameraStore } from '@stores';

import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';

const applyCameraPanelControls = (updatedCamera) => {
  const camera = useCameraStore.getState().camera;
  camera.position.x = updatedCamera.x;
  camera.position.y = updatedCamera.y;
  camera.position.z = updatedCamera.z;
  useCameraStore.setState({camera: camera});
};


const CameraTab = () => {
  const camera = useCameraStore((state) => state.camera);

  const initialPosition = camera?.position || { x: 0, y: 0, z: Const.CAMERA_ZOOM_DISTANCE_DEFAULT };
  const [x, setX] = useState(initialPosition.x);
  const [y, setY] = useState(initialPosition.y);
  const [z, setZ] = useState(initialPosition.z);
  
  const [distance, setDistance] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0); 


  useEffect(() => {
    if (camera && camera.position) {
      const { x: camX, y: camY, z: camZ } = camera.position;
      setX(camX);
      setY(camY);
      setZ(camZ);

      const sphericalCoords = calculateSphericalCoords(camX, camY, camZ);
      setDistance(sphericalCoords.distance);
      setLongitude(sphericalCoords.longitude);
      setLatitude(sphericalCoords.latitude);

    }
  }, [camera]);

  const handleValueChange = (setter, propertyName) => (newValue) => {
    const value = parseFloat(newValue[0]);
    setter(value);

    const positionUpdate = {
      x: propertyName === 'x' ? value : x,
      y: propertyName === 'y' ? value : y,
      z: propertyName === 'z' ? value : z,
    };
    applyCameraPanelControls(positionUpdate);
  };

  return (
    <section>
      <ControlSectionWrapper label={`Position X: ${x.toFixed(0)} km`}>
        <Slider
          value={[x]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step={"1"}
          onValueChange={handleValueChange(setX, 'x')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Position Y: ${y.toFixed(0)} km`}>
        <Slider
          value={[y]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step={"1"}
          onValueChange={handleValueChange(setY, 'y')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Position Z: ${z.toFixed(0)} km`}>
        <Slider
          value={[z]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step="1"
          onValueChange={handleValueChange(setZ, 'z')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Longitude: ${longitude.toFixed(0)}º`}>
        <Slider
          value={[longitude]}
          min={-180}
          max={180}
          step={"1"}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Latitude: ${latitude.toFixed(0)}º`}>
        <Slider
          value={[latitude]}
          min={-180}
          max={180}
          step={"1"}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Distance: ${distance.toFixed(0)} km`}>
        <Slider
          value={[distance]}
          min={0}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 3}
          step={"1"}
        />
        </ControlSectionWrapper>
    </section>
  );
}

export default CameraTab; 
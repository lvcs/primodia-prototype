import React, { useState, useEffect } from 'react';
import { useCameraStore } from '@stores';

import * as Const from '../../config/gameConstants.js'; 

import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';

const applyCameraPanelControls = (newPosition) => {
  useCameraStore.setState((state) => {
    const currentCamera = state.camera || {};
    const currentPosition = currentCamera.position || {};

    return {
      camera: {
        ...currentCamera,
        position: { 
          ...currentPosition, 
          ...newPosition
        },
      },
    };
  });
};


const CameraTab = () => {
  const camera = useCameraStore((state) => state.camera);

  const [x, setX] = useState(camera ? camera.position.x : 0);
  const [y, setY] = useState(camera ? camera.position.y : 0);
  const [z, setZ] = useState(camera ? camera.position.z : Const.CAMERA_ZOOM_DISTANCE_DEFAULT);

  useEffect(() => {
    if (camera) {
      setX(camera.position.x);
      setY(camera.position.y);
      setZ(camera.position.z);
    }
  }, [camera]);

  const handleValueChange = (setter, propertyName) => (newValue) => {
    const value = parseFloat(newValue[0]);
    setter(value);

    const newAttributes = {
      x: propertyName === 'x' ? value : x,
      y: propertyName === 'y' ? value : y,
      z: propertyName === 'z' ? value : z,
    };
    applyCameraPanelControls(newAttributes);
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

      <ControlSectionWrapper label={`Position Z (Zoom Distance): ${z.toFixed(0)} km`}>
        <Slider
          value={[z]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step="1"
          onValueChange={handleValueChange(setZ, 'z')}
        />
      </ControlSectionWrapper>
    </section>
  );
}

export default CameraTab; 
import { useState, useEffect } from 'react';

import * as Const from '@config/gameConfig.js'; 

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

const applyOrbitalControlPanelControls = (updatedOrbital) => {
  const orbitControls = useCameraStore.getState().orbitControls;
  orbitControls.target.x = updatedOrbital.x;
  orbitControls.target.y = updatedOrbital.y;
  orbitControls.target.z = updatedOrbital.z;
  useCameraStore.setState({orbitControls: orbitControls});
};


const CameraTab = () => {
  const camera = useCameraStore((state) => state.camera);
  const orbitControls = useCameraStore((state) => state.orbitControls);

  const initialPosition = camera?.position || { x: 0, y: 0, z: Const.CAMERA_ZOOM_DISTANCE_DEFAULT };
  const [x, setX] = useState(initialPosition.x);
  const [y, setY] = useState(initialPosition.y);
  const [z, setZ] = useState(initialPosition.z);
  
  const [distance, setDistance] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0);

  const [targetX, setTargetX] = useState(orbitControls?.target?.x ?? 0);
  const [targetY, setTargetY] = useState(orbitControls?.target?.y ?? 0);
  const [targetZ, setTargetZ] = useState(orbitControls?.target?.z ?? 0);

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
    if (orbitControls && orbitControls.target) {
      setTargetX(orbitControls.target.x ?? 0);
      setTargetY(orbitControls.target.y ?? 0);
      setTargetZ(orbitControls.target.z ?? 0);
    } else {
      setTargetX(0);
      setTargetY(0);
      setTargetZ(0);
    }
  }, [camera, orbitControls]);

  const handleCameraControls = (setter, propertyName) => (newValue) => {
    const value = parseFloat(newValue[0]);
    setter(value);

    const positionUpdate = {
      x: propertyName === 'x' ? value : x,
      y: propertyName === 'y' ? value : y,
      z: propertyName === 'z' ? value : z,
    };

    applyCameraPanelControls(positionUpdate);
  }

  const handleOrbitalControls = (setter, propertyName) => (newValue) => {
    const value = parseFloat(newValue[0]);
    setter(value);

    const targetUpdate = {
      x: propertyName === 'x' ? value : targetX,
      y: propertyName === 'y' ? value : targetY,
      z: propertyName === 'z' ? value : targetZ,
    };

    applyOrbitalControlPanelControls(targetUpdate);
  };

  return (
    <section>
      <ControlSectionWrapper label={`Position X: ${x.toFixed(0)} km`}>
        <Slider
          value={[x]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step={"1"}
          onValueChange={handleCameraControls(setX, 'x')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Position Y: ${y.toFixed(0)} km`}>
        <Slider
          value={[y]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step={"1"}
          onValueChange={handleCameraControls(setY, 'y')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Position Z: ${z.toFixed(0)} km`}>
        <Slider
          value={[z]}
          min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
          max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
          step="1"
          onValueChange={handleCameraControls(setZ, 'z')}
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

        <ControlSectionWrapper label={`Target X: ${targetX.toFixed(0)} km`}>
          <Slider
            value={[targetX]}
            min={-16000}
            max={16000}
            step={"100"}
            onValueChange={handleOrbitalControls(setTargetX, 'x')}
          />
        </ControlSectionWrapper>

        <ControlSectionWrapper label={`Target Y: ${targetY.toFixed(0)} km`}>
          <Slider
            value={[targetY]}
            min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
            max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}
            step={"1"}
            onValueChange={handleOrbitalControls(setTargetY, 'y')}
          />
          </ControlSectionWrapper>

          <ControlSectionWrapper label={`Target Z: ${targetZ.toFixed(0)} km`}>
            <Slider
              value={[targetZ]}
              min={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * -2}
              max={Const.CAMERA_ZOOM_DISTANCE_DEFAULT * 2}  
              step={"1"}
              onValueChange={handleOrbitalControls(setTargetZ, 'z')}
            />
          </ControlSectionWrapper>

          
    </section>
  );
}

export default CameraTab; 
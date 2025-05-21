import React from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';
import { useCameraStore } from '@stores/cameraStore';
import { GLOBE_RADIUS, CAMERA_MIN_DISTANCE_FACTOR, CAMERA_MAX_DISTANCE_FACTOR } from '@config/gameConfig';

function CameraTab() {
  const zoom = useCameraStore(state => state.zoom);
  const target = useCameraStore(state => state.target);
  const phi = useCameraStore(state => state.phi);
  const setZoom = useCameraStore(state => state.setZoom);

  const minZoom = GLOBE_RADIUS * CAMERA_MIN_DISTANCE_FACTOR;
  const maxZoom = GLOBE_RADIUS * CAMERA_MAX_DISTANCE_FACTOR;

  const handleZoomChange = (newValue) => {
    const value = newValue[0];
    setZoom(value);
  };

  const displayTargetX = target?.x || 0;
  const displayTargetY = target?.y || 0;
  const displayTargetZ = target?.z || 0;
  const displayYaw = phi || 0;
  const displayRoll = 0;

  return (
    <div>
      <ControlSectionWrapper label={`Target X: ${displayTargetX.toFixed(0)} km`}>
        <Slider
          value={[displayTargetX]}
          min={-GLOBE_RADIUS}
          max={GLOBE_RADIUS}
          step={GLOBE_RADIUS / 100}
          disabled
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Target Y: ${displayTargetY.toFixed(0)} km`}>
        <Slider
          value={[displayTargetY]}
          min={-GLOBE_RADIUS}
          max={GLOBE_RADIUS}
          step={GLOBE_RADIUS / 100}
          disabled
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Target Z: ${displayTargetZ.toFixed(0)} km`}>
        <Slider
          value={[displayTargetZ]}
          min={-GLOBE_RADIUS}
          max={GLOBE_RADIUS}
          step={GLOBE_RADIUS / 100}
          disabled
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Zoom Distance: ${zoom.toFixed(0)} km`}>
        <Slider
          value={[zoom]}
          min={minZoom}
          max={maxZoom}
          step={(maxZoom - minZoom) / 200}
          onValueChange={handleZoomChange}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Yaw (Phi): ${displayYaw.toFixed(2)} rad`}>
        <Slider
          value={[displayYaw]}
          min={0}
          max={Math.PI}
          step={Math.PI / 180}
          disabled
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Roll: ${displayRoll.toFixed(2)} rad`}>
        <Slider
          defaultValue={[displayRoll]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180}
          disabled
        />
      </ControlSectionWrapper>
    </div>
  );
}

CameraTab.propTypes = {};

export default CameraTab; 
import React from 'react';
import PropTypes from 'prop-types';
import { useCameraUIStore, useWorldSettingsStore } from '../../../stores';
import { ControlSectionWrapper } from '../../ui/ControlSectionWrapper';
import { Slider } from '../../ui/Slider';

const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

// Reasonable defaults if not found in store or for slider limits
const DEFAULT_WORLD_RADIUS = 1000;
const MIN_ZOOM_DISTANCE = 50;
const MAX_ZOOM_DISTANCE_FACTOR = 5; // Max zoom will be worldRadius * this factor

function CameraTab() {
  const {
    target,
    zoom,
    yaw,
    roll,
    setTarget,
    setZoom,
    setYaw,
    setRoll,
  } = useCameraUIStore((state) => ({
    target: state.target, // { x, y, z } or null
    zoom: state.zoom,
    yaw: state.yaw, // radians
    roll: state.roll, // radians
    setTarget: state.setTarget,
    setZoom: state.setZoom,
    setYaw: state.setYaw,
    setRoll: state.setRoll,
  }));

  const worldRadius = useWorldSettingsStore((state) => state.worldRadius) || DEFAULT_WORLD_RADIUS;
  
  const currentTarget = target || { x: 0, y: 0, z: 0 };

  const handleTargetChange = (axis, value) => {
    const numericValue = parseFloat(value[0]);
    setTarget({ ...currentTarget, [axis]: numericValue });
  };

  const handleZoomChange = (value) => {
    setZoom(parseFloat(value[0]));
  };

  const handleYawChange = (value) => {
    setYaw(parseFloat(value[0])); // Store as radians
  };

  const handleRollChange = (value) => {
    setRoll(parseFloat(value[0])); // Store as radians
  };

  const maxZoomDistance = worldRadius * MAX_ZOOM_DISTANCE_FACTOR;

  return (
    <div className="space-y-4">
      <ControlSectionWrapper label={`Target X: ${currentTarget.x.toFixed(2)}`}>
        <Slider
          defaultValue={[currentTarget.x]}
          min={-worldRadius}
          max={worldRadius}
          step={worldRadius / 100}
          onValueChange={(val) => handleTargetChange('x', val)}
          aria-label="Camera Target X"
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Target Y: ${currentTarget.y.toFixed(2)}`}>
        <Slider
          defaultValue={[currentTarget.y]}
          min={-worldRadius} 
          max={worldRadius}
          step={worldRadius / 100}
          onValueChange={(val) => handleTargetChange('y', val)}
          aria-label="Camera Target Y"
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Target Z: ${currentTarget.z.toFixed(2)}`}>
        <Slider
          defaultValue={[currentTarget.z]}
          min={-worldRadius}
          max={worldRadius}
          step={worldRadius / 100}
          onValueChange={(val) => handleTargetChange('z', val)}
          aria-label="Camera Target Z"
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Zoom Distance: ${zoom.toFixed(2)}`}>
        <Slider
          defaultValue={[zoom]}
          min={MIN_ZOOM_DISTANCE} 
          max={maxZoomDistance}
          step={(maxZoomDistance - MIN_ZOOM_DISTANCE) / 200} // Smaller step for smoother zoom
          onValueChange={handleZoomChange}
          aria-label="Camera Zoom Distance"
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Yaw: ${(yaw * RADIANS_TO_DEGREES).toFixed(1)}°`}>
        <Slider
          defaultValue={[yaw]} // Radian value for store and slider
          min={-Math.PI}
          max={Math.PI}
          step={DEGREES_TO_RADIANS * 1} // 1 degree steps in radians
          onValueChange={handleYawChange}
          aria-label="Camera Yaw"
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Roll: ${(roll * RADIANS_TO_DEGREES).toFixed(1)}°`}>
        <Slider
          defaultValue={[roll]} // Radian value for store and slider
          min={-Math.PI / 2} // Typically roll is constrained more than yaw
          max={Math.PI / 2}
          step={DEGREES_TO_RADIANS * 1} // 1 degree steps
          onValueChange={handleRollChange}
          aria-label="Camera Roll"
        />
      </ControlSectionWrapper>

      {/* Tilt (Pitch) could be added here if desired */}
      {/* <ControlSectionWrapper label={`Tilt: ${(tilt * RADIANS_TO_DEGREES).toFixed(1)}°`}> ... </ControlSectionWrapper> */}

      <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
        Adjust camera target, zoom, and orientation. These values are stored in radians where applicable.
      </p>
    </div>
  );
}

CameraTab.propTypes = {};

export default CameraTab; 
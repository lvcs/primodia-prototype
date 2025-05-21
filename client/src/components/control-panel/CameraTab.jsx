import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';
import { useCameraStore } from '@stores/cameraStore';
import * as camera from '@game/camera/camera'; // Import the camera API
import { GLOBE_RADIUS, CAMERA_MIN_DISTANCE_FACTOR, CAMERA_MAX_DISTANCE_FACTOR } from '@config/gameConfig';

function CameraTab() {
  // Subscribe to store properties that affect distance calculation or are displayed
  const target = useCameraStore(state => state.target);
  const position = useCameraStore(state => state.position); // Needed to reactively update distance

  const [currentDistance, setCurrentDistance] = useState(0);
  const [isLoadingDistance, setIsLoadingDistance] = useState(true);

  const minZoom = GLOBE_RADIUS * CAMERA_MIN_DISTANCE_FACTOR;
  const maxZoom = GLOBE_RADIUS * CAMERA_MAX_DISTANCE_FACTOR;

  // Effect to initialize and update distance when position or target changes
  useEffect(() => {
    const controls = camera.getControlsInstance();
    if (controls) {
      const dist = camera.getDistance(); // Uses controls.getDistance() internally
      setCurrentDistance(dist);
      setIsLoadingDistance(false);
    } else {
      // Fallback if controls are not yet available, try calculating from store pos/target
      if (position && target) {
        const dist = position.distanceTo(target);
        setCurrentDistance(dist);
        setIsLoadingDistance(false);
      } else {
        setIsLoadingDistance(true); // Keep loading if not enough data
      }
    }
  }, [position, target]); // Re-run when position or target from store changes

  const handleZoomChange = useCallback((newValue) => {
    const value = newValue[0];
    if (typeof value === 'number' && !isNaN(value)) {
      camera.setDistance(value, false); // Use false for non-animated, as per current plan state
      // The store subscription in camera will eventually update OrbitControls,
      // which then updates the store, triggering the useEffect above to update currentDistance.
    }
  }, []);

  const displayTargetX = target?.x || 0;
  const displayTargetY = target?.y || 0;
  const displayTargetZ = target?.z || 0;
  
  // Phi (yaw) is not directly in the store or simple to get reactively without controls instance access here.
  // For now, make it a non-interactive, fixed display.
  const displayYaw = 0; // Placeholder, OrbitControls.getAzimuthalAngle() would be needed.
  const displayRoll = 0; // Placeholder

  if (isLoadingDistance && currentDistance === 0) {
    // Provide a child element to satisfy ControlSectionWrapper's prop types
    return (
      <ControlSectionWrapper label="Camera Data">
        <span>Loading camera data...</span>
      </ControlSectionWrapper>
    );
  }

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

      <ControlSectionWrapper label={`Zoom Distance: ${currentDistance !== null && currentDistance !== undefined ? currentDistance.toFixed(0) : 'N/A'} km`}>
        <Slider
          value={[currentDistance !== null && currentDistance !== undefined ? currentDistance : minZoom]} // Provide a fallback for value
          min={minZoom}
          max={maxZoom}
          step={(maxZoom - minZoom) / 200 || 1} // Ensure step is not zero
          onValueChange={handleZoomChange}
          disabled={isLoadingDistance} // Disable if distance is still loading
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Yaw (Phi): ${displayYaw.toFixed(2)} rad`}>
        <Slider
          value={[displayYaw]}
          min={0}
          max={Math.PI} // Typical range for polar angle, azimuth can be -PI to PI
          step={Math.PI / 180}
          disabled // Disabled as it's not wired up to OrbitControls reactively
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Roll: ${displayRoll.toFixed(2)} rad`}>
        <Slider
          defaultValue={[displayRoll]} // Changed to defaultValue as it's not controlled
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
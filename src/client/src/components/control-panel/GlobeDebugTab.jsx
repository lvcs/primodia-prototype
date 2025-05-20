import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '../ui/ControlSectionWrapper';
import { Slider } from '../ui/Slider';

// TODO: This tab should subscribe to a Zustand store (e.g., a debug store or game state store)
// that gets updated by the game logic instead of relying on a window global.

// Mock of how the window global might be used for now
let mockGlobeDebugData = {
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  // other info can be added here
};

if (typeof window !== 'undefined') {
  window.updateGlobeDebugInfo = (newData) => { // newData might be the full globe object or pre-formatted strings/values
    console.log('Mock window.updateGlobeDebugInfo called with:', newData);
    // This would ideally update a store.
    if (newData && typeof newData === 'object') {
        mockGlobeDebugData = { ...mockGlobeDebugData, ...newData };
    }
    // const event = new CustomEvent('globeDebugUpdate', { detail: newData });
    // window.dispatchEvent(event);
  };
}

// Mock function to apply globe rotation changes to the game engine
const applyGlobeRotationControls = (axis, value) => {
    console.log(`TODO: Apply Globe Rotation: Axis ${axis}, Value ${value}`);
    // This would interact with THREE.js globe object
    mockGlobeDebugData[`rotation${axis.toUpperCase()}`] = value;
     if (typeof window !== 'undefined' && window.updateGlobeDebugInfo) {
        // Trigger a general update if other info is also displayed
        window.updateGlobeDebugInfo(mockGlobeDebugData); 
    }
};

function GlobeDebugTab() {
  const [rotationX, setRotationX] = useState(mockGlobeDebugData.rotationX);
  const [rotationY, setRotationY] = useState(mockGlobeDebugData.rotationY);
  const [rotationZ, setRotationZ] = useState(mockGlobeDebugData.rotationZ);
  // Add other states for displayed info if needed

  // Simulate periodic refresh if global mock is updated (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
        setRotationX(mockGlobeDebugData.rotationX);
        setRotationY(mockGlobeDebugData.rotationY);
        setRotationZ(mockGlobeDebugData.rotationZ);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRotationChange = (setter, axis) => (newValue) => {
    const value = newValue[0];
    setter(value);
    applyGlobeRotationControls(axis, value);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Globe Debug Information</h3>

      <ControlSectionWrapper label={`Rotation X: ${rotationX.toFixed(2)} rad`}>
        <Slider
          defaultValue={[rotationX]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180} // 1 degree steps
          onValueChange={handleRotationChange(setRotationX, 'X')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Rotation Y: ${rotationY.toFixed(2)} rad`}>
        <Slider
          defaultValue={[rotationY]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180}
          onValueChange={handleRotationChange(setRotationY, 'Y')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Rotation Z: ${rotationZ.toFixed(2)} rad`}>
        <Slider
          defaultValue={[rotationZ]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180}
          onValueChange={handleRotationChange(setRotationZ, 'Z')}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label="Globe Dynamics Info">
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <p>Current Rotation (deg): { (rotationX * 180 / Math.PI).toFixed(2) }, { (rotationY * 180 / Math.PI).toFixed(2) }, { (rotationZ * 180 / Math.PI).toFixed(2) }</p>
          {/* TODO: Add other dynamic info from planetGroup if available via store */}
        </div>
      </ControlSectionWrapper>
      <p className="text-xs mt-1 text-gray-500">
        Current content is mock or from a temporary window global. Real integration needs a store.
      </p>
    </div>
  );
}

GlobeDebugTab.propTypes = {};

export default GlobeDebugTab; 
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '../ui/ControlSectionWrapper';

// TODO: This tab should subscribe to a Zustand store (e.g., useCameraUIStore or a debug store)
// that gets updated by the game logic instead of relying on a window global.

// Mock of how the window global might be used for now
let mockCameraDebugData = {
  position: { x: 0, y: 0, z: 0 },
  target: { x: 0, y: 0, z: 1 },
  distance: 0,
  fov: 60,
};

if (typeof window !== 'undefined') {
  window.updateCameraDebugInfo = (newData) => { // newData might be the full camera object or pre-formatted strings
    console.log('Mock window.updateCameraDebugInfo called with:', newData);
    // This would ideally update a store.
    // For this mock, we'll assume newData is an object like mockCameraDebugData
    if (newData && typeof newData === 'object') {
        mockCameraDebugData = { ...mockCameraDebugData, ...newData };
    }
    // const event = new CustomEvent('cameraDebugUpdate', { detail: newData });
    // window.dispatchEvent(event);
  };
}

function CameraDebugTab() {
  const [debugData, setDebugData] = useState(mockCameraDebugData);

  // useEffect(() => {
  //   const handleUpdate = (event) => {
  //     // Assuming event.detail contains an object with { position, target, distance, fov }
  //     if (event.detail && typeof event.detail === 'object') {
  //        setDebugData(prevData => ({ ...prevData, ...event.detail })); 
  //     }
  //   };
  //   window.addEventListener('cameraDebugUpdate', handleUpdate);
  //   return () => {
  //     window.removeEventListener('cameraDebugUpdate', handleUpdate);
  //   };
  // }, []);

  // Simulate periodic refresh if global mock is updated (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
        setDebugData(prev => ({...prev, ...mockCameraDebugData})); // simplistic merge
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Camera Debug Information</h3>
      <ControlSectionWrapper label="Camera Info">
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <p>Pos: {debugData.position?.x?.toFixed(2)}, {debugData.position?.y?.toFixed(2)}, {debugData.position?.z?.toFixed(2)} km</p>
          <p>Target: {debugData.target?.x?.toFixed(2)}, {debugData.target?.y?.toFixed(2)}, {debugData.target?.z?.toFixed(2)} km</p>
          <p>Dist: {debugData.distance?.toFixed(2)} km</p>
          <p>FOV: {debugData.fov}°</p>
        </div>
      </ControlSectionWrapper>
      <p className="text-xs mt-1 text-gray-500">
        Current content is mock or from a temporary window global. Real integration needs a store.
      </p>
      {/* TODO: Add sliders if needed, similar to CameraTab, but linked to debug store/logic */}
    </div>
  );
}

CameraDebugTab.propTypes = {};

export default CameraDebugTab; 
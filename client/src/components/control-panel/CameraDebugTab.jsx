import React from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '../ui/ControlSectionWrapper';
import { useDebugStore } from '../../stores';

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
  const { position, target, distance, fov } = useDebugStore((state) => state.cameraDebugInfo);

  // The PLAN.md mentions potentially adding sliders here.
  // For now, we will just display the information from the store.
  // If sliders are needed, they would read from and write to useDebugStore.

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Camera Debug Information</h3>
      <ControlSectionWrapper label="Live Camera Info">
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          {position && <p dangerouslySetInnerHTML={{ __html: position }} />}
          {target && <p dangerouslySetInnerHTML={{ __html: target }} />}
          {distance && <p dangerouslySetInnerHTML={{ __html: distance }} />}
          {fov && <p dangerouslySetInnerHTML={{ __html: fov }} />}
          {(!position && !target && !distance && !fov) && 
            <p>Camera debug info not yet available. Waiting for game state update...</p>
          }
        </div>
      </ControlSectionWrapper>
      <p className="text-xs mt-1 text-gray-500">
        This panel displays live debug information about the camera.
      </p>
      {/* TODO: Add sliders if necessary, connected to debug store/logic. */}
    </div>
  );
}

CameraDebugTab.propTypes = {};

export default CameraDebugTab; 
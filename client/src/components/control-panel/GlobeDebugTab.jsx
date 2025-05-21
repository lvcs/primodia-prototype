import React from 'react';
import PropTypes from 'prop-types';
import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';
import { useDebugStore } from '@stores';

// TODO: If these sliders are to control the globe, the game logic needs to subscribe to these store values.
// And the initial values should also be set by the game logic via the store.

function GlobeDebugTab() {
  const globeDebugInfo = useDebugStore((state) => state.globeDebugInfo);
  const setGlobeDebugInfo = useDebugStore((state) => state.setGlobeDebugInfo);

  // For now, sliders will manage their own state and update the store.
  // Ideally, the store would be the single source of truth, initialized by game state.
  // The `rotation` field in the store holds the pre-formatted string.
  // We might want to add rotationX, rotationY, rotationZ to the store if sliders directly control it.

  // Placeholder values if not in store, or for local slider state if preferred
  const [currentRotationX, setCurrentRotationX] = React.useState(globeDebugInfo.rotationX || 0);
  const [currentRotationY, setCurrentRotationY] = React.useState(globeDebugInfo.rotationY || 0);
  const [currentRotationZ, setCurrentRotationZ] = React.useState(globeDebugInfo.rotationZ || 0);

  // This is just an example of how sliders could update the store if we add specific fields for them.
  // For now, they are local, and only the text info is from the store's `rotation` field.
  const handleRotationChange = (axis, value) => {
    const numericValue = parseFloat(value[0]);
    let newInfo = {};
    if (axis === 'X') {
      setCurrentRotationX(numericValue);
      newInfo = { rotationX: numericValue };
    }
    if (axis === 'Y') {
      setCurrentRotationY(numericValue);
      newInfo = { rotationY: numericValue };
    }
    if (axis === 'Z') {
      setCurrentRotationZ(numericValue);
      newInfo = { rotationZ: numericValue };
    }
    // console.log(`GlobeDebugTab: Setting rotation ${axis} to ${numericValue}`);
    // This would update the store if we had specific actions/state for individual axes.
    // For example: useDebugStore.getState().setGlobeRotationAxis(axis, numericValue);
    // For now, we are mainly focusing on the text display from `globeDebugInfo.rotation`.
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Globe Debug Information</h3>

      <ControlSectionWrapper label={`Rotation X: ${currentRotationX.toFixed(2)} rad`}>
        <Slider
          defaultValue={[currentRotationX]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180} // 1 degree steps
          onValueChange={(val) => handleRotationChange('X', val)}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Rotation Y: ${currentRotationY.toFixed(2)} rad`}>
        <Slider
          defaultValue={[currentRotationY]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180}
          onValueChange={(val) => handleRotationChange('Y', val)}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label={`Rotation Z: ${currentRotationZ.toFixed(2)} rad`}>
        <Slider
          defaultValue={[currentRotationZ]}
          min={-Math.PI}
          max={Math.PI}
          step={Math.PI / 180}
          onValueChange={(val) => handleRotationChange('Z', val)}
        />
      </ControlSectionWrapper>

      <ControlSectionWrapper label="Globe Dynamics Info (from Store)">
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-700 p-2 rounded min-h-[3em]">
          {globeDebugInfo.rotation ? 
            (<p dangerouslySetInnerHTML={{ __html: globeDebugInfo.rotation.replace(/<br>/g, '<br />') }} />) :
            (<p>Globe dynamics info not yet available. Waiting for game state update...</p>)
          }
        </div>
      </ControlSectionWrapper>
      <p className="text-xs mt-1 text-gray-500">
        Sliders are for local debug. Text info is from the store.
      </p>
    </div>
  );
}

GlobeDebugTab.propTypes = {};

export default GlobeDebugTab; 
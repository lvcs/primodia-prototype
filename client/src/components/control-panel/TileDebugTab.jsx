import React from 'react';
import PropTypes from 'prop-types';
import { useDebugStore } from '@stores'; // Adjusted import path

// TODO: This tab should subscribe to a Zustand store slice 
// that gets updated by the game logic instead of relying on a window global.

// Mock of how the window global might be used for now, to demonstrate listening
let mockTileDebugContent = 'Tile debug info will appear here. Click on a tile in-game.';

if (typeof window !== 'undefined') {
  window.updateTileDebugInfo = (htmlContent) => {
    console.log('Mock window.updateTileDebugInfo called with:', htmlContent);
    // In a real interim step, you might try to set state here, but it won't work directly
    // as this function is outside React component scope for direct state update.
    // This highlights the need for a proper state management solution (e.g., Zustand event or store update).
    mockTileDebugContent = htmlContent; // This won't re-render the component directly
    // A possible temporary hack (not recommended for production):
    // const event = new CustomEvent('tileDebugUpdate', { detail: htmlContent });
    // window.dispatchEvent(event);
  };
}

function TileDebugTab() {
  const tileDebugHTML = useDebugStore((state) => state.tileDebugHTML);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Tile Debug Information</h3>
      <div 
        className="p-2 border rounded bg-gray-50 dark:bg-gray-700 text-xs overflow-auto h-48"
        // Using dangerouslySetInnerHTML here reflects the old mechanism.
        // This is NOT recommended and should be refactored to structured data rendering.
        dangerouslySetInnerHTML={{ __html: tileDebugHTML }}
      />
      <p className="text-xs mt-1 text-gray-500">
        This panel displays debug information for the selected tile.
      </p>
    </div>
  );
}

TileDebugTab.propTypes = {};

export default TileDebugTab; 
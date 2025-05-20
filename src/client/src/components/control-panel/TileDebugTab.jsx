import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

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
  // For a proper reactive update, this state should be fed from a store
  // that the game logic updates.
  const [debugHtml, setDebugHtml] = useState(mockTileDebugContent);

  // useEffect(() => {
  //   const handleUpdate = (event) => {
  //     setDebugHtml(event.detail);
  //   };
  //   window.addEventListener('tileDebugUpdate', handleUpdate);
  //   return () => {
  //     window.removeEventListener('tileDebugUpdate', handleUpdate);
  //   };
  // }, []);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Tile Debug Information</h3>
      <div 
        className="p-2 border rounded bg-gray-50 dark:bg-gray-700 text-xs overflow-auto h-48"
        // Using dangerouslySetInnerHTML here reflects the old mechanism.
        // This is NOT recommended and should be refactored to structured data rendering.
        dangerouslySetInnerHTML={{ __html: debugHtml }}
      />
      <p className="text-xs mt-1 text-gray-500">
        Current content is mock or from a temporary window global. Real integration needs a store.
      </p>
    </div>
  );
}

TileDebugTab.propTypes = {};

export default TileDebugTab; 
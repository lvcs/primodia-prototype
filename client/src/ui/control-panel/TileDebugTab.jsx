import React from 'react';

// TODO: This tab should subscribe to a Zustand store slice 
// that gets updated by the game logic instead of relying on a window global.

let mockTileDebugContent = 'Tile debug info will appear here. Click on a tile in-game.';

if (typeof window !== 'undefined') {
  window.updateTileDebugInfo = (htmlContent) => {
    console.log('Mock window.updateTileDebugInfo called with:', htmlContent);
    mockTileDebugContent = htmlContent;
  };
}

function TileDebugTab() {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Tile Debug Information</h3>
      <div 
        className="p-2 border rounded bg-gray-50 dark:bg-gray-700 text-xs overflow-auto h-48"
      />
      <p className="text-xs mt-1 text-gray-500">
        This panel displays debug information for the selected tile.
      </p>
    </div>
  );
}

TileDebugTab.propTypes = {};

export default TileDebugTab; 
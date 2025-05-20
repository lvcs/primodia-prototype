import React from 'react';
import PropTypes from 'prop-types';

function MiniMap(props) {
  // Props might include map data, player position, etc. later
  return (
    <div 
      id="mini-map-component"
      className="absolute bottom-3 right-3 w-56 h-40 bg-gray-800 bg-opacity-75 shadow-md border border-gray-700 rounded-lg pointer-events-auto flex items-center justify-center"
    >
      <p className="text-gray-400 text-sm">Mini-Map Placeholder</p>
      {/* Actual minimap rendering will go here */}
    </div>
  );
}

MiniMap.propTypes = {
  // Define prop types as needed, e.g.:
  // mapData: PropTypes.object,
  //playerPosition: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
};

export default MiniMap; 
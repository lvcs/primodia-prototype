import React from 'react';
import PropTypes from 'prop-types';

function TopBar({ 
  resources = 'Wood: 100, Food: 50', // Default placeholder 
  turnInfo = 1 // Default placeholder
}) {
  return (
    <div 
      id="top-bar-component"
      className="absolute top-0 left-0 right-0 p-3 bg-gray-800 bg-opacity-75 shadow-md flex justify-between items-center pointer-events-auto"
    >
      <div id="resources-display" className="text-sm text-gray-200">
        {/* Placeholder for resource display. Could be an object or a formatted string */}
        {typeof resources === 'string' ? resources : JSON.stringify(resources)}
      </div>
      <div id="turn-info-display" className="text-sm text-gray-200">
        {/* Placeholder for turn information */}
        Turn: {turnInfo}
      </div>
    </div>
  );
}

TopBar.propTypes = {
  resources: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // More specific later
  turnInfo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // More specific later
};

export default TopBar; 
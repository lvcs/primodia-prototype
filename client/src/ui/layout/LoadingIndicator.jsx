import React from 'react';
import PropTypes from 'prop-types';

function LoadingIndicator({ isActive }) {
  if (!isActive) {
    return null;
  }

  return (
    <div 
      id="loading-indicator-component"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-xl flex flex-col items-center space-y-3"
    >
      <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg text-gray-200">Loading world, please wait...</p>
    </div>
  );
}

LoadingIndicator.propTypes = {
  isActive: PropTypes.bool.isRequired,
};

export default LoadingIndicator; 
import React from 'react';
import PropTypes from 'prop-types';

export default function LoadingPage({ message }) {
  return (
    <div
      id="loading-page-react"
      className="w-screen h-screen bg-gray-900 text-white flex flex-col items-center justify-center absolute inset-0 z-50"
    >
      <div
        id="loading-container-react"
        className="p-6 bg-gray-800 bg-opacity-90 rounded-lg shadow-xl flex flex-col items-center space-y-3"
      >
        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-gray-200">{message || 'Loading, please wait...'}</p>
      </div>
    </div>
  );
}

LoadingPage.propTypes = {
  message: PropTypes.string,
}; 
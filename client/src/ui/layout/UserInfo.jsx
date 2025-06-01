import React from 'react';
import PropTypes from 'prop-types';

// Placeholder for a planet icon, e.g., using an SVG or an icon library
const PlanetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// User avatar icon
const UserAvatar = ({ username }) => {
  // Get first letter of username
  const initial = username ? username.charAt(0).toUpperCase() : '?';
  
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
      {initial}
    </div>
  );
};

function UserInfo({ username, onSignOut, onPlanetViewClick }) {
  if (!username) {
    return null; // Or some other UI indicating no user is logged in
  }

  return (
    <div 
      id="user-info-component"
      className="absolute top-3 right-3 z-20 p-3 bg-gray-800 bg-opacity-75 rounded-lg shadow-md flex items-center space-x-3"
    >
      <UserAvatar username={username} />
      <span className="text-gray-200 font-medium">{username}</span>
      {onPlanetViewClick && (
        <button 
          onClick={onPlanetViewClick}
          title="Switch to Planet View"
          className="p-1.5 hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
        >
          <PlanetIcon />
        </button>
      )}
      <button 
        onClick={onSignOut}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Sign Out
      </button>
    </div>
  );
}

UserInfo.propTypes = {
  username: PropTypes.string,
  onSignOut: PropTypes.func.isRequired,
  onPlanetViewClick: PropTypes.func,
};

UserAvatar.propTypes = {
  username: PropTypes.string,
};

export default UserInfo; 
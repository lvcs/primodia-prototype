import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import UnifiedControlPanel from '../components/control-panel/UnifiedControlPanel';
import UserInfo from '../components/layout/UserInfo';
import TopBar from '../components/layout/TopBar';
import MiniMap from '../components/layout/MiniMap';
import { initGame } from '../game/game';
import { useAuthStore } from '../stores';

function GamePage({ onSignOut, onGlobeViewClick }) {
  const canvasRef = useRef(null);
  const currentUser = useAuthStore(state => state.currentUser); // Added to ensure it's available for UserInfo

  useEffect(() => {
    if (canvasRef.current) {
      console.log('Initializing game with canvas:', canvasRef.current);
      try {
        initGame(canvasRef.current);
        console.log('Game initialized successfully');
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    }
  }, []); // Game initialization should only run once when the component mounts

  return (
    <div id="game-page-container-react" className="w-full h-full relative">
      {currentUser && (
        <UserInfo
          username={currentUser.username}
          onSignOut={onSignOut}
          onGlobeViewClick={onGlobeViewClick}
        />
      )}
      <div id="game-container-react" className="w-full h-full absolute inset-0" style={{ display: 'block' }}>
        <canvas ref={canvasRef} id="game-canvas-react" className="absolute inset-0" style={{ width: '100vw', height: '100vh' }}></canvas>
        <div id="ui-overlay-react" className="absolute inset-0 w-full h-full pointer-events-none">
          <TopBar />
          <MiniMap />
          <UnifiedControlPanel className="absolute bottom-2 left-2 z-10 pointer-events-auto" />
        </div>
      </div>
    </div>
  );
}

GamePage.propTypes = {
  onSignOut: PropTypes.func.isRequired,
  onGlobeViewClick: PropTypes.func.isRequired,
};

export default GamePage; 
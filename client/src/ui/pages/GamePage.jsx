import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import UnifiedControlPanel from '@ui/control-panel/UnifiedControlPanel';
import UserInfo from '@ui/layout/UserInfo';
import TopBar from '@ui/layout/TopBar';
import MiniMap from '@ui/layout/MiniMap';
import { initGame } from '@/game';
import { stopAnimationLoop } from '@/render/mainLoop';
import { useAuthStore } from '@stores';

function GamePage({ onSignOut, onPlanetViewClick }) {
  const canvasRef = useRef(null);
  const currentUser = useAuthStore(state => state.currentUser); // Added to ensure it's available for UserInfo

  useEffect(() => {
    if (canvasRef.current) {
      try {
        initGame(canvasRef.current);
      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    }

    // Cleanup function to stop animation loop when component unmounts
    return () => {
      stopAnimationLoop();
    };
  }, []); // Game initialization should only run once when the component mounts

  return (
    <div id="game-page-container-react" className="w-full h-full relative">
      {currentUser && (
        <UserInfo
          username={currentUser.username}
          onSignOut={onSignOut}
          onPlanetViewClick={onPlanetViewClick}
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
  onPlanetViewClick: PropTypes.func.isRequired,
};

export default GamePage; 
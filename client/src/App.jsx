import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedControlPanel from './components/control-panel/UnifiedControlPanel';
import LoadingIndicator from './components/layout/LoadingIndicator';
import UserInfo from './components/layout/UserInfo';
import TopBar from './components/layout/TopBar';
import MiniMap from './components/layout/MiniMap';
import { useAuthStore } from './stores'; // Import useAuthStore from index
import LoginPage from './pages/LoginPage'; // Import LoginPage
import RegisterPage from './pages/RegisterPage'; // Import RegisterPage
import { initGame } from './game/game'; // Updated import path
// import { useAuthStore } from './stores/authStore'; // Future auth store


function App() {
  const canvasRef = useRef(null);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // Use individual selectors instead of creating an object
  const currentUser = useAuthStore(state => state.currentUser);
  const isAuthLoading = useAuthStore(state => state.isLoading);
  const authError = useAuthStore(state => state.error);
  const logout = useAuthStore(state => state.logout);

  // Check for stored auth on mount - only run once
  useEffect(() => {
    useAuthStore.getState().checkInitialAuth();
  }, []); 

  // Initialize game when user logs in and canvas is available
  useEffect(() => {
    // Only attempt to initialize if user is logged in and game is not already initialized
    if (currentUser && !gameInitialized && canvasRef.current) {
      setIsGameLoading(true);
      
      try {
        console.log('Initializing game with canvas:', canvasRef.current);
        initGame(canvasRef.current);
        setGameInitialized(true);
        console.log('Game initialized successfully');
      } catch (error) {
        console.error('Failed to initialize game:', error);
      } finally {
        setIsGameLoading(false);
      }
    }
  }, [currentUser, gameInitialized]);

  const handleSignOut = () => {
    logout();
    setGameInitialized(false);
  };

  const handleGlobeViewClick = () => {
    console.log('Globe View icon clicked. TODO: Implement camera animation.');
    // This would eventually call something like:
    // useCameraUIStore.getState().setViewMode('globe');
    // or trigger an animation via a camera control module.
  };

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  // Only show loading if authentication is in progress or game is initializing
  const showAppLoading = isAuthLoading || isGameLoading;

  // If no user and auth check is complete, show login/register
  if (!currentUser && !isAuthLoading) {
    return showLogin 
      ? <LoginPage onSwitchToRegister={switchToRegister} />
      : <RegisterPage onSwitchToLogin={switchToLogin} />;
  }

  return (
    <div id="game-page-react" className="w-screen h-screen bg-gray-900 text-white flex flex-col relative overflow-hidden">
      <LoadingIndicator isActive={showAppLoading} />

      {/* Show user info when logged in and not loading */}
      {!showAppLoading && currentUser && (
        <UserInfo
          username={currentUser.username}
          onSignOut={handleSignOut}
          onGlobeViewClick={handleGlobeViewClick}
        />
      )}

      {/* Loading Indicator - centered */}
      {showAppLoading && (
        <div 
          id="loading-container-react" 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 p-4 bg-black bg-opacity-75 rounded"
        >
          <p>Loading world, please wait...</p>
        </div>
      )}

      {/* Game Container */}
      {currentUser && (
        <div id="game-container-react" className="w-full h-full absolute inset-0" style={{ display: 'block' }}> 
          <canvas ref={canvasRef} id="game-canvas-react" className="w-full h-full absolute inset-0"></canvas>
          
          {/* UI Overlay - sits on top of the canvas */}
          <div id="ui-overlay-react" className="absolute inset-0 w-full h-full pointer-events-none">
            <TopBar />
            <MiniMap />
            {/* Top Bar - for resources, turn info */}
            <div id="top-bar-react" className="absolute top-0 left-0 right-0 p-2 flex justify-between pointer-events-auto bg-black bg-opacity-30">
              <div id="resources-react">Resources: ...</div>
              <div id="turn-info-react">Turn: 1</div>
            </div>

            {/* Control Panel - bottom left, already a component */}
            <UnifiedControlPanel className="absolute bottom-2 left-2 z-10 pointer-events-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

App.propTypes = {};

export default App; 
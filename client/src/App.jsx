import { useEffect, useState } from 'react';
import { useAuthStore } from '@stores';
import LoginPage from '@ui/pages/LoginPage';
import RegisterPage from '@ui/pages/RegisterPage';
import LoadingPage from '@ui/pages/LoadingPage'; // Import the new LoadingPage
import GamePage from '@ui/pages/GamePage'; // Import the new GamePage

function App() {
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  const currentUser = useAuthStore(state => state.currentUser);
  const isAuthLoading = useAuthStore(state => state.isLoading);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    useAuthStore.getState().checkInitialAuth();
  }, []);

  useEffect(() => {
    if (currentUser && !gameInitialized) {
      setIsGameLoading(true);
      setGameInitialized(true);
      setIsGameLoading(false);
    } else if (!currentUser) {
      setGameInitialized(false);
    }
  }, [currentUser, gameInitialized]);

  const handleSignOut = () => {
    logout();
    setGameInitialized(false);
  };


  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  if (isAuthLoading) {
    return <LoadingPage message="Authenticating..." />;
  }

  if (!currentUser) {
    return showLogin
      ? <LoginPage onSwitchToRegister={switchToRegister} />
      : <RegisterPage onSwitchToLogin={switchToLogin} />;
  }

  if (isGameLoading && !gameInitialized) {
    return <LoadingPage message="Loading game..." />;
  }
  
  if (currentUser && gameInitialized) {
    return (
      <div id="app-container-react" className="w-screen h-screen bg-gray-900 text-white flex flex-col relative overflow-hidden dark">
        <GamePage
          onSignOut={handleSignOut}
        />
      </div>
    );
  }
  
  return <LoadingPage message="Initializing application..." />;
}

export default App; 
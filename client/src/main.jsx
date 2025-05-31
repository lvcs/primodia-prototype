import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { 
  useAuthStore,
  useCameraStore, 
  useGameStore,
  useWorldStore, 
  useUIStore, 
} from '@stores';
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "@ui/styles/index.css"; // Import Tailwind CSS


if (import.meta.env.DEV) {
  window.authStore = useAuthStore;
  window.cameraStore = useCameraStore;
  window.gameStore = useGameStore;
  window.uiStore = useUIStore;
  window.worldStore = useWorldStore;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <App />
    </Theme>
  </React.StrictMode>,
); 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { 
  useUIStore, 
  useCameraStore, 
  useWorldStore, 
  useAuthStore 
} from './stores';
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "@ui/styles/index.css"; // Import Tailwind CSS

// Expose all stores to the window in development mode
// Dev debug only, never use those in the codebase
if (import.meta.env.DEV) {
  window.uiStore = useUIStore;
  window.cameraStore = useCameraStore;
  window.worldStore = useWorldStore;
  window.authStore = useAuthStore;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <App />
    </Theme>
  </React.StrictMode>,
); 
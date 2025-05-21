import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { 
  useUIStore, 
  useCameraStore, 
  useWorldStore, 
  useDebugStore, 
  useAuthStore 
} from './stores';
import "./index.css"; // Import Tailwind CSS
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

// Expose all stores to the window in development mode
// Dev debug only, never use those in codebase
if (import.meta.env.DEV) {
  window.uiStore = useUIStore;
  window.cameraStore = useCameraStore;
  window.worldStore = useWorldStore;
  window.debugStore = useDebugStore;
  window.authStore = useAuthStore;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <App />
    </Theme>
  </React.StrictMode>,
); 
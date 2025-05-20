import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { useUIStore } from './stores'; // Imports from stores/index.js

// Expose the UI store to the window in development mode
if (import.meta.env.DEV) {
  window.uiStore = useUIStore;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
); 
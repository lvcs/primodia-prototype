import './auth.js';
import { initGame } from './game/game.js';

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Display error message on screen
  const errorDisplay = document.createElement('div');
  errorDisplay.style.position = 'fixed';
  errorDisplay.style.top = '10px';
  errorDisplay.style.left = '10px';
  errorDisplay.style.right = '10px';
  errorDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDisplay.style.color = 'white';
  errorDisplay.style.padding = '10px';
  errorDisplay.style.zIndex = '10000';
  errorDisplay.style.fontFamily = 'monospace';
  errorDisplay.style.whiteSpace = 'pre-wrap';
  errorDisplay.style.maxHeight = '50vh';
  errorDisplay.style.overflow = 'auto';
  
  errorDisplay.innerHTML = `<h3>Error Occurred</h3>
    <p>${event.error.message}</p>
    <pre>${event.error.stack}</pre>
    <button onclick="location.reload()">Reload</button>`;
    
  document.body.appendChild(errorDisplay);
});

// Check if the user is already logged in
const token = localStorage.getItem('token');
if (token) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  
  // Initialize game with a try-catch block
  try {
    console.log('Starting game initialization...');
    initGame();
  } catch (error) {
    console.error('Error during game initialization:', error);
  }
} else {
  console.log('User not logged in, showing login screen');
} 
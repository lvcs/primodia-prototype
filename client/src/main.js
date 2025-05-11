import './auth.js';
import { initGame } from './game/game.js';

// Check if the user is already logged in
const token = localStorage.getItem('token');
if (token) {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  initGame();
} 
import loginTemplate from './pages/login.html?raw';
import registerTemplate from './pages/register.html?raw';
import gameTemplate from './pages/game.html?raw';
import { setupLogin, setupRegister } from './auth.js';
import { initGame } from './game/game.js';
import { renderGlobeControls } from './ui/index.js';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
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

const app = document.getElementById('app');

function renderLoginPage() {
  app.innerHTML = loginTemplate;
  setupLogin(renderGamePage, renderRegisterPage);
}

function renderRegisterPage() {
  app.innerHTML = registerTemplate;
  setupRegister(renderLoginPage);
}

function renderGamePage() {
  app.innerHTML = gameTemplate;
  renderGlobeControls();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userNameSpan = document.getElementById('user-name');
  if (userNameSpan) userNameSpan.textContent = user.username || '';
  const signOutBtn = document.getElementById('sign-out');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      renderLoginPage();
    });
  }
  initGame();
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    renderGamePage();
  } else {
    renderLoginPage();
  }
}); 
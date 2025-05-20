import { initGame } from './game/game.js';

const API_URL = 'http://localhost:3000/api';

export function setupLogin(onSuccess, onShowRegister) {
  document.getElementById('login-button').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSuccess();
    } catch (error) {
      alert(error.message);
    }
  });
  document.getElementById('go-register').addEventListener('click', (e) => {
    e.preventDefault();
    onShowRegister();
  });
}

export function setupRegister(onShowLogin) {
  document.getElementById('register-button').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    if (!username || !email || !password) {
      alert('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      alert('Registration successful! Please log in.');
      onShowLogin();
    } catch (error) {
      alert(error.message);
    }
  });
  document.getElementById('go-login').addEventListener('click', (e) => {
    e.preventDefault();
    onShowLogin();
  });
} 
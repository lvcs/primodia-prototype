import { create } from 'zustand';
import zukeeper from 'zukeeper';  

// Mock API functions (replace with actual API calls later)
const mockLoginApi = async (username, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username && password) {
        // Accept any non-empty username/password for testing
        resolve({ 
          user: { id: '1', username, email: `${username}@example.com` }, 
          token: 'fake-jwt-token' 
        });
      } else {
        reject(new Error('Invalid credentials - Username and password are required'));
      }
    }, 1000);
  });
};

const mockRegisterApi = async (username, password, email) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username && password && email) {
        // Simulate successful registration
        resolve({ 
          user: { id: '2', username, email }, 
          token: 'new-fake-jwt-token' 
        });
      } else {
        reject(new Error('Registration failed: Missing details'));
      }
    }, 1000);
  });
};

const useAuthStore = create(zukeeper((set, get) => ({
  currentUser: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockLoginApi(username, password);
      set({ currentUser: response.user, token: response.token, isLoading: false });
      // Persist token (e.g., localStorage) - to be added
      localStorage.setItem('primodia_token', response.token);
      localStorage.setItem('primodia_user', JSON.stringify(response.user));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  register: async (username, password, email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockRegisterApi(username, password, email);
      set({ currentUser: response.user, token: response.token, isLoading: false });
      // Persist token
      localStorage.setItem('primodia_token', response.token);
      localStorage.setItem('primodia_user', JSON.stringify(response.user));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  logout: () => {
    set({ currentUser: null, token: null, error: null, isLoading: false });
    // Clear persisted token
    localStorage.removeItem('primodia_token');
    localStorage.removeItem('primodia_user');
  },

  clearError: () => {
    set({ error: null });
  },
  
  // Check for existing token on store initialization (e.g., page refresh)
  checkInitialAuth: () => {
    const token = localStorage.getItem('primodia_token');
    const userString = localStorage.getItem('primodia_user');
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        set({ currentUser: user, token: token });
      } catch (e) {
        // Invalid user string, clear storage
        localStorage.removeItem('primodia_token');
        localStorage.removeItem('primodia_user');
      }
    }
  }
})));

export { useAuthStore }; 
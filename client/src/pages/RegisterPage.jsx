import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuthStore } from '../stores';

function RegisterPage({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(''); // For client-side validation like password mismatch

  // Use individual selectors instead of creating an object
  const register = useAuthStore(state => state.register);
  const isLoading = useAuthStore(state => state.isLoading);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  useEffect(() => {
    // Clear any previous auth errors when the component mounts and error exists
    if (authError) {
      clearError();
    }
  }, [authError, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(''); // Clear local errors
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (!username || !password || !email) {
      setLocalError('All fields are required.'); // Or rely on store error for this
      return;
    }
    // The register action in the store will set currentUser if successful
    await register(username, password, email);
    // No need to check currentUser here, App.jsx will react to store changes
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-200 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-blue-400">Create Account</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username-reg" className="block text-sm font-medium text-gray-400">Username</label>
            <input 
              id="username-reg"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="email-reg" className="block text-sm font-medium text-gray-400">Email</label>
            <input 
              id="email-reg"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label htmlFor="password-reg" className="block text-sm font-medium text-gray-400">Password</label>
            <input 
              id="password-reg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="confirm-password-reg" className="block text-sm font-medium text-gray-400">Confirm Password</label>
            <input 
              id="confirm-password-reg"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Confirm your password"
            />
          </div>

          {displayError && (
            <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-center">
              <p className="text-sm text-red-300">{displayError}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Create Account'}
          </button>
        </form>
        
        {onSwitchToLogin && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline transition ease-in-out duration-150">
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

RegisterPage.propTypes = {
  onSwitchToLogin: PropTypes.func,
};

export default RegisterPage; 
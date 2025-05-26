import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useAuthStore } from '@/stores'

// Mock the auth store
vi.mock('@/stores', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the pages
vi.mock('@/pages/LoginPage', () => ({
  default: ({ onSwitchToRegister }) => (
    <div data-testid="login-page">
      <button onClick={onSwitchToRegister}>Switch to Register</button>
    </div>
  ),
}))

vi.mock('@/pages/RegisterPage', () => ({
  default: ({ onSwitchToLogin }) => (
    <div data-testid="register-page">
      <button onClick={onSwitchToLogin}>Switch to Login</button>
    </div>
  ),
}))

vi.mock('@/pages/LoadingPage', () => ({
  default: ({ message }) => (
    <div data-testid="loading-page">{message}</div>
  ),
}))

vi.mock('@/pages/GamePage', () => ({
  default: ({ onSignOut, onPlanetViewClick }) => (
    <div data-testid="game-page">
      <button onClick={onSignOut}>Sign Out</button>
      <button onClick={onPlanetViewClick}>Planet View</button>
    </div>
  ),
}))

describe('App Component', () => {
  const mockAuthStore = {
    currentUser: null,
    isLoading: false,
    logout: vi.fn(),
    checkInitialAuth: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockImplementation((selector) => selector(mockAuthStore))
    useAuthStore.getState = vi.fn(() => mockAuthStore)
  })

  it('shows loading page when auth is loading', () => {
    useAuthStore.mockImplementation((selector) => 
      selector({ ...mockAuthStore, isLoading: true })
    )

    render(<App />)
    expect(screen.getByTestId('loading-page')).toBeInTheDocument()
    expect(screen.getByText('Authenticating...')).toBeInTheDocument()
  })

  it('shows login page when user is not authenticated', () => {
    render(<App />)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('shows game page when user is authenticated', () => {
    useAuthStore.mockImplementation((selector) => 
      selector({ ...mockAuthStore, currentUser: { id: 1, username: 'testuser' } })
    )

    render(<App />)
    expect(screen.getByTestId('game-page')).toBeInTheDocument()
  })

  it('calls checkInitialAuth on mount', () => {
    render(<App />)
    expect(mockAuthStore.checkInitialAuth).toHaveBeenCalledTimes(1)
  })
}) 
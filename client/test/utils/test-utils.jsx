import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { initialState, ...renderOptions } = options

  // Add any providers your app needs here
  function Wrapper({ children }) {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Mock functions for common use cases
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
}

export const mockAuthStore = {
  currentUser: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  checkInitialAuth: vi.fn(),
}

// Helper to create mock Three.js objects
export const createMockThreeObject = (type = 'Object3D') => ({
  type,
  position: { x: 0, y: 0, z: 0, set: vi.fn() },
  rotation: { x: 0, y: 0, z: 0, set: vi.fn() },
  scale: { x: 1, y: 1, z: 1, set: vi.fn() },
  add: vi.fn(),
  remove: vi.fn(),
  traverse: vi.fn(),
  clone: vi.fn(() => createMockThreeObject(type)),
})

// Helper to wait for async operations
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper to create mock socket
export const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
})

// Re-export everything from testing library
export * from '@testing-library/react'
export { vi } from 'vitest' 
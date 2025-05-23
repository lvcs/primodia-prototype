# Testing Guide for Primodia Client

This guide covers the testing setup and best practices for the Primodia client application.

## Testing Stack

- **Vitest**: Fast unit test framework optimized for Vite
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **jsdom**: DOM environment for unit tests

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Structure

```
client/
├── test/
│   ├── setup.js              # Test environment setup
│   ├── utils/
│   │   └── test-utils.jsx     # Testing utilities
│   ├── unit/                  # Unit tests
│   │   ├── stores/            # Store tests (add as needed)
│   │   ├── utils/             # Utility tests (add as needed)
│   │   └── App.test.jsx       # Main App component test
│   └── e2e/                   # End-to-end tests
│       └── app.spec.js
```

## Writing Unit Tests

### Component Testing

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders with children', () => {
    render(<MyComponent>Hello World</MyComponent>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<MyComponent onClick={handleClick}>Click me</MyComponent>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Store Testing

```jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().reset() // Reset store state
  })

  it('should login user', async () => {
    const { login } = useAuthStore.getState()
    await login('username', 'password')
    
    expect(useAuthStore.getState().currentUser).toBeTruthy()
  })
})
```

### Utility Testing

```jsx
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/date'

describe('Date Utils', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01')
    expect(formatDate(date)).toBe('January 1, 2024')
  })
})
```

## Writing E2E Tests

```javascript
import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/')
    
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  })
})
```

## Best Practices

### Unit Tests

1. **Test behavior, not implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and expected outcomes

2. **Use descriptive test names**
   ```jsx
   // Good
   it('should show error message when login fails')
   
   // Bad
   it('should work')
   ```

3. **Arrange, Act, Assert pattern**
   ```jsx
   it('should increment counter when button is clicked', () => {
     // Arrange
     render(<Counter initialValue={0} />)
     
     // Act
     fireEvent.click(screen.getByRole('button', { name: 'Increment' }))
     
     // Assert
     expect(screen.getByText('1')).toBeInTheDocument()
   })
   ```

4. **Mock external dependencies**
   ```jsx
   vi.mock('socket.io-client', () => ({
     io: vi.fn(() => mockSocket)
   }))
   ```

### E2E Tests

1. **Test critical user journeys**
   - Login/logout flow
   - Main application features
   - Error scenarios

2. **Use data-testid attributes**
   ```jsx
   <button data-testid="submit-button">Submit</button>
   ```

3. **Wait for elements properly**
   ```javascript
   await expect(page.locator('[data-testid="result"]')).toBeVisible()
   ```

4. **Test across different viewports**
   ```javascript
   await page.setViewportSize({ width: 375, height: 667 }) // Mobile
   ```

## Mocking Guidelines

### Three.js Components

Three.js components are automatically mocked in the test setup. For custom mocks:

```jsx
import { createMockThreeObject } from '@/test/utils/test-utils'

const mockScene = createMockThreeObject('Scene')
```

### API Calls

```jsx
vi.mock('@/api/client', () => ({
  fetchUser: vi.fn(() => Promise.resolve(mockUser)),
  updateUser: vi.fn(() => Promise.resolve()),
}))
```

### Zustand Stores

```jsx
vi.mock('@/stores', () => ({
  useAuthStore: vi.fn((selector) => selector(mockAuthStore)),
}))
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

The CI pipeline includes:
1. Linting
2. Unit tests with coverage
3. E2E tests
4. Build verification

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test Button.test.jsx

# Run tests in debug mode
npm run test:ui

# Run with verbose output
npm run test -- --reporter=verbose
```

### E2E Tests

```bash
# Run in headed mode
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- --grep "login"

# Debug mode
npm run test:e2e -- --debug
```

## Common Issues

### 1. Three.js Related Errors

If you see Three.js related errors, ensure the mocks are properly set up in `setup.js`.

### 2. Async Operations

Use `waitFor` for async operations:

```jsx
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 3. Canvas/WebGL Issues

Canvas and WebGL are mocked by default. For specific canvas testing:

```jsx
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 
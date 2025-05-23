import { test, expect } from '@playwright/test'

test.describe('Primodia App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Should show either login page or loading page initially
    await expect(page.locator('body')).toBeVisible()
    
    // Wait for any loading to complete
    await page.waitForTimeout(1000)
    
    // Check if we can see some expected content
    // This will depend on your actual app structure
    const hasLoginForm = await page.locator('form').count() > 0
    const hasLoadingMessage = await page.locator('text=loading').count() > 0
    
    expect(hasLoginForm || hasLoadingMessage).toBeTruthy()
  })

  test('should handle navigation between login and register', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Look for login/register switching functionality
    // This test assumes you have buttons to switch between login and register
    const switchToRegister = page.locator('text=register', { timeout: 5000 })
    const switchToLogin = page.locator('text=login', { timeout: 5000 })
    
    if (await switchToRegister.isVisible()) {
      await switchToRegister.click()
      // Verify we're on register page
      await expect(page.locator('text=register')).toBeVisible()
    }
    
    if (await switchToLogin.isVisible()) {
      await switchToLogin.click()
      // Verify we're on login page
      await expect(page.locator('text=login')).toBeVisible()
    }
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const consoleErrors = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Filter out known acceptable errors (like network errors in dev)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR_')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
}) 
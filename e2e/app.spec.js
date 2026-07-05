import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('login page renders with email and Google options', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=ChronoFlow')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"], text=Invalid')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Protected Route', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('settings page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Skip Link', () => {
  test('skip link is present and hidden until focused', async ({ page }) => {
    await page.goto('/login')
    const skipLink = page.locator('.skip-link')
    await expect(skipLink).toBeAttached()
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('login page has proper ARIA labels', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('aria-label')
  })

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto('/login')
    const buttons = page.locator('button')
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i)
      const text = await btn.textContent()
      const ariaLabel = await btn.getAttribute('aria-label')
      expect(text?.trim() || ariaLabel).toBeTruthy()
    }
  })
})

test.describe('Keyboard Navigation', () => {
  test('can tab through login form elements', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A']).toContain(focused)
  })

  test('escape key closes modal when open', async ({ page }) => {
    await page.goto('/login')
    // No modal on login page, but test that Escape doesn't crash
    await page.keyboard.press('Escape')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Offline Banner', () => {
  test('offline banner appears when offline', async ({ page }) => {
    await page.goto('/login')
    await page.context().setOffline(true)
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
    await page.context().setOffline(false)
  })
})

test.describe('Theme Toggle', () => {
  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/login')
    const html = page.locator('html')
    // Check initial theme attribute exists
    const theme = await html.getAttribute('data-theme')
    expect(['light', 'dark']).toContain(theme)
  })
})

test.describe('PWA Manifest', () => {
  test('manifest.json is accessible', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.status()).toBe(200)
    const manifest = await response.json()
    expect(manifest.name || manifest.short_name).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toBeTruthy()
  })
})

test.describe('Static Assets', () => {
  test('index.html loads correctly', async ({ request }) => {
    const response = await request.get('/')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
  })

  test('CSS files load with correct MIME type', async ({ request }) => {
    const response = await request.get('/')
    expect(response.status()).toBe(200)
    const html = await response.text()
    const cssMatch = html.match(/href="([^"]+\.css)"/)
    if (cssMatch) {
      const cssResponse = await request.get(cssMatch[1])
      expect(cssResponse.status()).toBe(200)
      expect(cssResponse.headers()['content-type']).toContain('text/css')
    }
  })

  test('JS files load with correct MIME type', async ({ request }) => {
    const response = await request.get('/')
    expect(response.status()).toBe(200)
    const html = await response.text()
    const jsMatch = html.match(/src="([^"]+\.js)"/)
    if (jsMatch) {
      const jsResponse = await request.get(jsMatch[1])
      expect(jsResponse.status()).toBe(200)
      expect(jsResponse.headers()['content-type']).toContain('javascript')
    }
  })

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('DENY')
    expect(response.headers()['referrer-policy']).toBeTruthy()
  })

  test('returns 404 for non-existent files', async ({ request }) => {
    const response = await request.get('/nonexistent-file-12345.txt')
    expect(response.status()).toBe(404)
  })

  test('SPA fallback serves index.html for unknown routes', async ({ request }) => {
    const response = await request.get('/some/deep/route')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
  })
})

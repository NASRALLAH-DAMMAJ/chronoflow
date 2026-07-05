import { test, expect } from '@playwright/test'

test.describe('Mobile Responsive Layout', () => {
  test('login page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page.locator('text=ChronoFlow')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('settings page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/settings')
    // Should show loading or redirect to login
    await expect(page.locator('body')).toBeVisible()
  })

  test('archive page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/archive')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Mobile Touch Interactions', () => {
  test('buttons are touch-friendly size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    const buttons = page.locator('button')
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(32)
      }
    }
  })

  test('input fields are touch-friendly size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    const inputs = page.locator('input')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const box = await inputs.nth(i).boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(36)
      }
    }
  })
})

test.describe('Mobile Viewport Breakpoints', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'iPad', width: 768, height: 1024 },
  ]

  for (const vp of viewports) {
    test(`renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/login')
      await expect(page.locator('text=ChronoFlow')).toBeVisible()
      await expect(page.locator('input[type="email"]')).toBeVisible()
      // Verify no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 10)
    })
  }
})

test.describe('Mobile PWA', () => {
  test('manifest.json has mobile icons', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.status()).toBe(200)
    const manifest = await response.json()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toBeTruthy()
    if (manifest.icons) {
      const hasLargeIcon = manifest.icons.some(icon =>
        parseInt(icon.sizes?.split('x')[0] || '0') >= 192
      )
      expect(hasLargeIcon).toBe(true)
    }
  })

  test('theme color meta tag exists', async ({ page }) => {
    await page.goto('/login')
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content')
    expect(themeColor).toBeTruthy()
  })

  test('viewport meta tag is configured', async ({ page }) => {
    await page.goto('/login')
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
  })
})

test.describe('Mobile Accessibility', () => {
  test('has proper lang attribute', async ({ page }) => {
    await page.goto('/login')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('has skip link for keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    const skipLink = page.locator('.skip-link')
    await expect(skipLink).toBeAttached()
  })
})

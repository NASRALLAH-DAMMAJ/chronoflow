import { test, expect } from '@playwright/test'

// These tests require authentication - they'll be skipped if no auth is set up
// Use PLAYWRIGHT_USER_EMAIL and PLAYWRIGHT_USER_PASSWORD env vars

const hasAuth = process.env.PLAYWRIGHT_USER_EMAIL && process.env.PLAYWRIGHT_USER_PASSWORD

test.describe('Block CRUD (authenticated)', () => {
  test.skip(!hasAuth, 'requires authentication')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_USER_EMAIL)
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('Add button opens block form', async ({ page }) => {
    await page.click('button:has-text("Add")')
    await expect(page.locator('text=Label')).toBeVisible()
    await expect(page.locator('text=Category')).toBeVisible()
  })

  test('Create a new block via form', async ({ page }) => {
    await page.click('button:has-text("Add")')
    await page.fill('input[placeholder*="Deep work"]', 'Test Block')
    await page.click('button:has-text("Next: Place on dial")')
    // Placement mode - click on dial
    await expect(page.locator('text=Drag on dial to place')).toBeVisible()
  })

  test('Cancel block creation', async ({ page }) => {
    await page.click('button:has-text("Add")')
    await expect(page.locator('text=Label')).toBeVisible()
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('text=Label')).not.toBeVisible()
  })

  test('Day navigation works', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()
    // Click next day
    await page.click('[aria-label="Next day"]')
    // Click previous day
    await page.click('[aria-label="Previous day"]')
  })

  test('Today button appears when not on today', async ({ page }) => {
    await page.click('[aria-label="Next day"]')
    await expect(page.locator('button:has-text("Today")')).toBeVisible()
    await page.click('button:has-text("Today")')
  })

  test('Streak display shows correct format', async ({ page }) => {
    await expect(page.locator('text=Streak:')).toBeVisible()
    await expect(page.locator('strong:has-text("days")')).toBeVisible()
  })

  test('Empty state shows when no blocks', async ({ page }) => {
    await expect(page.locator('text=No blocks yet')).toBeVisible()
    await expect(page.locator('text=Tap Add to plan your day')).toBeVisible()
  })

  test('Complete day button appears on today', async ({ page }) => {
    await expect(page.locator('button:has-text("Complete day")')).toBeVisible()
  })

  test('Theme toggle switches mode', async ({ page }) => {
    const themeBtn = page.locator('button:has-text("Dark"), button:has-text("Light")')
    await expect(themeBtn).toBeVisible()
    await themeBtn.click()
    // Theme should toggle
    const html = page.locator('html')
    const theme = await html.getAttribute('data-theme')
    expect(['light', 'dark']).toContain(theme)
  })

  test('Sign out button works', async ({ page }) => {
    await page.click('button:has-text("Sign out")')
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })
})

test.describe('Settings Page (authenticated)', () => {
  test.skip(!hasAuth, 'requires authentication')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_USER_EMAIL)
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('Settings page loads with sleep schedule', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Sleep Schedule')).toBeVisible()
  })

  test('Settings page has back navigation', async ({ page }) => {
    await page.goto('/settings')
    await page.click('button:has-text("←")')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Recurring Rules Page (authenticated)', () => {
  test.skip(!hasAuth, 'requires authentication')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_USER_EMAIL)
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('Recurring rules page loads', async ({ page }) => {
    await page.goto('/settings/rules')
    await expect(page.locator('h1:has-text("Recurring Rules")')).toBeVisible({ timeout: 5000 })
  })

  test('Add rule button opens form', async ({ page }) => {
    await page.goto('/settings/rules')
    await page.click('button:has-text("Add Rule")')
    await expect(page.locator('text=Label')).toBeVisible()
  })
})

test.describe('Archive Page (authenticated)', () => {
  test.skip(!hasAuth, 'requires authentication')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_USER_EMAIL)
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('Archive page loads with filters', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('h1:has-text("Archive")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Category')).toBeVisible()
  })

  test('Archive page shows empty state', async ({ page }) => {
    await page.goto('/archive')
    await expect(page.locator('text=No archived blocks.')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Analytics Page (authenticated)', () => {
  test.skip(!hasAuth, 'requires authentication')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_USER_EMAIL)
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_USER_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  })

  test('Analytics page loads with date range', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=From')).toBeVisible()
    await expect(page.locator('text=To')).toBeVisible()
  })

  test('Analytics has PDF export button', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible({ timeout: 10000 })
  })
})

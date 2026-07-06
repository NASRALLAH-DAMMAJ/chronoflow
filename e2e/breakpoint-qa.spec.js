import { test, expect } from '@playwright/test'

test.describe('Breakpoint QA', () => {
  const viewports = [
    { width: 320, height: 568, name: '320px' },
    { width: 375, height: 667, name: '375px' },
    { width: 414, height: 896, name: '414px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 1024, height: 768, name: '1024px' },
  ]

  for (const vp of viewports) {
    test(`page renders at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      await expect(page.locator('body')).toBeVisible()
      await page.screenshot({ path: `e2e/screenshots/${vp.name}.png`, fullPage: true })
    })
  }
})

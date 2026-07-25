import { test, expect } from '@playwright/test'

test('has title and dashboard header', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/6SPM/i)
})

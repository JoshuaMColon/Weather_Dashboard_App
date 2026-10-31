import { expect, test } from '@playwright/test'
import { mockApi, seedPlaces } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await seedPlaces(page, ['cupertino', 'london'], 'cupertino')
})

test('icon buttons show a tooltip on hover and keyboard focus; Esc dismisses it', async ({ page }) => {
  await page.goto('/')
  const locate = page.locator('[data-testid="locate"]:visible')
  const tip = page.getByRole('tooltip')
  await locate.hover()
  await expect(tip).toBeVisible()
  await expect(tip).toHaveText('Use my location')
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()

  await page.mouse.move(0, 0)
  await locate.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(tip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()
})

test('page dots name the city they jump to', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await page.goto('/')
  const dot = page.getByRole('tab', { name: 'City 2 of 2' })
  await dot.hover()
  await expect(page.getByRole('tooltip')).toHaveText('London')
  await expect(dot).toHaveAccessibleDescription('London')
})

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  test('tapping never leaves a tooltip behind', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('list-button').tap()
    await page.getByTestId('close-list').tap()
    await page.waitForTimeout(800)
    await expect(page.getByRole('tooltip')).toBeHidden()
  })
})

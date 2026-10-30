import { expect, test, type Page } from '@playwright/test'
import { mockApi, seedPlaces } from './fixtures'

const frames = (page: Page) => page.evaluate(() => window.__wxSky?.frames ?? -1)

/** Running CSS animations on the animated icons and compass needle. */
const iconAnimations = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('.wxi *, .needle-wobble')].reduce((n, el) => n + el.getAnimations().length, 0))

test.describe('animated weather', () => {
  test('sky canvas animates, icons move and the scene crossfades between cities', async ({ page }) => {
    await mockApi(page)
    await seedPlaces(page, ['london', 'cupertino'], 'london')
    await page.goto('/')
    await expect(page.getByTestId('current-temp')).toHaveText('52°')
    await expect(page.getByTestId('sky-canvas')).toHaveAttribute('data-motion', 'animated')
    await expect.poll(() => page.evaluate(() => window.__wxSky?.running)).toBe(true)
    await expect.poll(() => page.evaluate(() => window.__wxSky?.scene)).toBe('rain-day')
    const f0 = await frames(page)
    await page.waitForTimeout(1000)
    expect((await frames(page)) - f0).toBeGreaterThan(10)
    expect(await iconAnimations(page)).toBeGreaterThan(0)

    // Wind needle eases in and settles on the real direction (225° from → 45° arrow + 360).
    await page.getByTestId('tile-wind').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('wind-needle')).toHaveAttribute('data-angle', '405')

    // Switching cities swaps the scene (crossfade) without recreating the canvas.
    const canvas = await page.getByTestId('sky-canvas').elementHandle()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.locator('[data-testid="mini-card"]:visible', { hasText: 'Cupertino' }).click()
    await expect(page.getByTestId('city-name')).toHaveText('Cupertino')
    await expect.poll(() => page.evaluate(() => window.__wxSky?.scene)).toBe('clear-day')
    expect(await canvas!.evaluate((el) => el.isConnected)).toBe(true)
  })

  test('storm scenes can flash lightning', async ({ page }) => {
    await mockApi(page)
    await seedPlaces(page, ['miami'], 'miami')
    await page.goto('/')
    await expect.poll(() => page.evaluate(() => window.__wxSky?.scene)).toBe('storm-day')
    expect(await page.evaluate(() => window.__wxSky!.flash())).toBe(true)
  })

  test('reduced motion disables sky, icon, needle and count-up animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockApi(page)
    await seedPlaces(page, ['sapporo'], 'sapporo')
    await page.goto('/')
    // No count-up: the final temperature is there from the first paint.
    await expect(page.getByTestId('current-temp')).toHaveText('25°', { timeout: 1000 })
    const canvas = page.getByTestId('sky-canvas')
    await expect(canvas).toHaveAttribute('data-motion', 'static')
    await page.waitForLoadState('load')
    await page.waitForTimeout(400)
    const f0 = await frames(page)
    expect(f0).toBeGreaterThan(0) // a static frame was painted
    await page.waitForTimeout(1200)
    expect(await frames(page)).toBe(f0) // …and nothing more
    expect(await page.evaluate(() => window.__wxSky?.running)).toBe(false)
    expect(await page.locator('.wxi').count()).toBeGreaterThan(5)
    expect(await iconAnimations(page)).toBe(0)
    // Sun arc and needle are drawn at their final positions immediately.
    await page.getByTestId('tile-wind').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('wind-needle')).toHaveAttribute('data-angle', '405')
    // Lightning hook is a no-op outside storms.
    expect(await page.evaluate(() => window.__wxSky!.flash())).toBe(false)
  })
})

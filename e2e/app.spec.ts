import { expect, test } from '@playwright/test'
import { mockApi, seedPlaces } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('renders the iPhone-style forecast for the selected city', async ({ page }) => {
  await seedPlaces(page, ['cupertino', 'london'], 'cupertino')
  await page.goto('/')
  await expect(page).toHaveTitle(/Weather/)
  const hero = page.getByTestId('hero')
  await expect(hero.getByTestId('city-name')).toHaveText('Cupertino')
  await expect(hero.getByTestId('current-temp')).toHaveText('75°')
  await expect(hero).toContainText('Clear')
  await expect(page.getByTestId('hourly').locator('li')).not.toHaveCount(0)
  await expect(page.getByTestId('hourly')).toContainText('Now')
  await expect(page.getByTestId('hourly')).toContainText('Sunset')
  await expect(page.getByTestId('daily').locator('li')).toHaveCount(10)
  await expect(page.getByTestId('now-dot')).toHaveCount(1)
  for (const t of ['uv', 'feels', 'wind', 'humidity', 'visibility', 'pressure', 'precip', 'sun', 'aqi', 'moon']) {
    await expect(page.getByTestId(`tile-${t}`)).toBeVisible()
  }
  await expect(page.locator('[data-sky]').first()).toHaveAttribute('data-sky', 'clear-day')
})

test('night sky comes from the location’s sunrise and sunset', async ({ page }) => {
  await seedPlaces(page, ['reykjavik'], 'reykjavik')
  await page.goto('/')
  await expect(page.getByTestId('city-name')).toHaveText('Reykjavík')
  await expect(page.locator('[data-sky]').first()).toHaveAttribute('data-sky', 'clear-night')
})

test('search autocomplete previews a city and adds it to the list', async ({ page }) => {
  await seedPlaces(page, ['cupertino'], 'cupertino')
  await page.goto('/')
  const search = page.locator('[data-testid="search-input"]:visible')
  await search.fill('Lond')
  const option = page.getByRole('option', { name: /London.*United Kingdom/ })
  await expect(option).toBeVisible()
  await search.press('ArrowDown')
  await search.press('Enter')
  await expect(page.getByTestId('preview-bar')).toBeVisible()
  await expect(page.getByTestId('city-name')).toHaveText('London')
  await page.getByTestId('add-city').click()
  await expect(page.getByTestId('preview-bar')).toHaveCount(0)
  await expect(page.locator('[data-testid="mini-card"]:visible')).toHaveCount(2)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('wx:places') ?? '[]').map((p: { name: string }) => p.name))
  expect(stored).toEqual(['Cupertino', 'London'])
})

test('switching to Celsius updates every temperature', async ({ page }) => {
  await seedPlaces(page, ['cupertino'], 'cupertino')
  await page.goto('/')
  await expect(page.getByTestId('current-temp')).toHaveText('75°')
  await page.locator('[data-testid="account-button"]:visible, [data-testid="account-button-list"]:visible').first().click()
  await page.getByRole('radio', { name: '°C' }).click()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByTestId('current-temp')).toHaveText('24°')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wx:prefs') ?? '{}').units)).toBe('C')
})

test('shows a notable-change banner when storms are coming', async ({ page }) => {
  await seedPlaces(page, ['austin'], 'austin')
  await page.goto('/')
  await expect(page.getByTestId('notables')).toContainText(/thunder/i)
})

test('recovers from an API error with a retry button', async ({ page }) => {
  await page.unrouteAll()
  await mockApi(page, { failWeather: true })
  await seedPlaces(page, ['london'], 'london')
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await page.unrouteAll()
  await mockApi(page)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('current-temp')).toHaveText('52°')
})

test('/demo seeds sample cities and returns to the home URL', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByTestId('toast')).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-testid="mini-card"]:visible')).toHaveCount(5)
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('page dots and the city list move between cities', async ({ page }) => {
    await seedPlaces(page, ['cupertino', 'london', 'sapporo'], 'cupertino')
    await page.goto('/')
    await expect(page.getByTestId('city-name')).toHaveText('Cupertino')
    await page.getByRole('tab', { name: 'City 2 of 3' }).tap()
    await expect(page.getByTestId('city-name')).toHaveText('London')
    await expect(page.locator('[data-sky]').first()).toHaveAttribute('data-sky', 'rain-day')
    await page.getByTestId('list-button').tap()
    await page.locator('[data-testid="mini-card"]:visible', { hasText: 'Sapporo' }).tap()
    await expect(page.getByTestId('city-name')).toHaveText('Sapporo')
    await expect(page.locator('[data-sky]').first()).toHaveAttribute('data-sky', 'snow-day')
  })

  test('respects reduced motion (no particle animation)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedPlaces(page, ['london'], 'london')
    await page.goto('/')
    await expect(page.getByTestId('city-name')).toHaveText('London')
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.getByTestId('sky-canvas')).toHaveAttribute('data-motion', 'static')
  })
})

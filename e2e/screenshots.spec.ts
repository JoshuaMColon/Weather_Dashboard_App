import { expect, test, type Page } from '@playwright/test'
import { mockApi, seedPlaces, type CITIES } from './fixtures'

// Portfolio screenshots from mocked fixtures. Run with: SHOTS_DIR=./shots npx playwright test screenshots
const DIR = process.env.SHOTS_DIR
test.skip(!DIR, 'set SHOTS_DIR to capture screenshots')

const ALL: Array<keyof typeof CITIES> = ['cupertino', 'reykjavik', 'london', 'sapporo', 'austin']
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } } as const

async function open(page: Page, city: keyof typeof CITIES) {
  await mockApi(page)
  await seedPlaces(page, ALL, city)
  await page.goto('/')
  await expect(page.getByTestId('tiles')).toBeVisible()
  await page.waitForTimeout(1200)
}

for (const [size, viewport] of Object.entries(sizes)) {
  test.describe(size, () => {
    test.use({ viewport, deviceScaleFactor: 2, hasTouch: size === 'mobile' })

    for (const [name, city] of [['clear-day', 'cupertino'], ['night', 'reykjavik'], ['rain', 'london'], ['snow', 'sapporo'], ['notable-storm', 'austin']] as const) {
      test(name, async ({ page }) => {
        await open(page, city)
        await page.screenshot({ path: `${DIR}/${size}-${name}.png` })
      })
    }

    test('tiles', async ({ page }) => {
      await open(page, 'cupertino')
      await page.getByTestId(size === 'mobile' ? 'tile-uv' : 'daily').evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 1024 ? 90 : 24) }))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${DIR}/${size}-tiles.png` })
    })

    test('city-list', async ({ page }) => {
      await open(page, 'cupertino')
      if (size === 'mobile') await page.getByTestId('list-button').click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${DIR}/${size}-city-list.png` })
    })

    test('search', async ({ page }) => {
      await open(page, 'cupertino')
      if (size === 'mobile') await page.getByTestId('list-button').click()
      await page.locator('[data-testid="search-input"]:visible').fill('Lon')
      await expect(page.getByRole('option').first()).toBeVisible()
      await page.screenshot({ path: `${DIR}/${size}-search.png` })
    })
  })
}

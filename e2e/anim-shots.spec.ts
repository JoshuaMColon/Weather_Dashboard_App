import { expect, test, type Page } from '@playwright/test'
import { renameSync } from 'node:fs'
import { mockApi, seedPlaces, type CITIES } from './fixtures'

// Animated-sky stills and clips from mocked fixtures.
// Run with: ANIM_DIR=./anim npx playwright test anim-shots
const DIR = process.env.ANIM_DIR
test.skip(!DIR, 'set ANIM_DIR to capture animation stills and clips')
test.describe.configure({ mode: 'parallel' })

type City = keyof typeof CITIES
const ALL: City[] = ['cupertino', 'reykjavik', 'seattle', 'london', 'miami', 'sapporo', 'sanfrancisco']
const mobile = { width: 390, height: 844 }
const desktop = { width: 1440, height: 900 }

async function open(page: Page, city: City) {
  await mockApi(page)
  await seedPlaces(page, ALL, city)
  await page.goto('/')
  await expect(page.getByTestId('tiles')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__wxSky?.running)).toBe(true)
  await page.waitForTimeout(2200) // let particles fill the sky and the count-up finish
}

async function still(page: Page, city: City, path: string, flash = false) {
  await open(page, city)
  if (flash) {
    await page.evaluate(() => window.__wxSky!.flash(true))
    await page.waitForTimeout(90)
  }
  await page.screenshot({ path })
  if (flash) await page.evaluate(() => window.__wxSky!.release())
}

const scenes: Array<[string, City]> = [
  ['day', 'cupertino'], ['night', 'reykjavik'], ['cloudy', 'seattle'], ['rain', 'london'],
  ['storm', 'miami'], ['snow', 'sapporo'], ['fog', 'sanfrancisco'],
]

test.describe('mobile', () => {
  test.use({ viewport: mobile, deviceScaleFactor: 2, hasTouch: true })
  for (const [name, city] of scenes) {
    test(name, async ({ page }) => still(page, city, `${DIR}/mobile-${name}.png`, name === 'storm'))
  }
})

test.describe('desktop', () => {
  test.use({ viewport: desktop, deviceScaleFactor: 1 })
  for (const [name, city] of [['storm', 'miami'], ['night', 'reykjavik'], ['snow', 'sapporo']] as const) {
    test(name, async ({ page }) => still(page, city, `${DIR}/desktop-${name}.png`, name === 'storm'))
  }
})

for (const [name, city] of [['storm', 'miami'], ['snow', 'sapporo']] as const) {
  test(`clip ${name}`, async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({ viewport: mobile, hasTouch: true, recordVideo: { dir: `${DIR}/raw`, size: mobile } })
    const page = await context.newPage()
    await open(page, city)
    if (name === 'storm') {
      // Natural strikes happen too, but guarantee a couple inside the clip.
      await page.waitForTimeout(1800)
      await page.evaluate(() => window.__wxSky!.flash())
      await page.waitForTimeout(3200)
      await page.evaluate(() => window.__wxSky!.flash())
      await page.waitForTimeout(2400)
    } else {
      await page.waitForTimeout(7500)
    }
    const video = page.video()!
    await context.close()
    renameSync(await video.path(), `${DIR}/mobile-${name}.webm`)
  })
}

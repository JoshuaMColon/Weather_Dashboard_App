import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { mockApi, seedPlaces } from './fixtures'

// Regenerates public/og.png and public/apple-touch-icon.png. Run with: ASSETS=1 npx playwright test assets
test.skip(!process.env.ASSETS, 'set ASSETS=1 to regenerate social/icon images')

test('og image', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 })
  await mockApi(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedPlaces(page, ['cupertino', 'reykjavik', 'london', 'sapporo', 'austin'], 'cupertino')
  await page.goto('/')
  await expect(page.getByTestId('tiles')).toBeVisible()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'public/og.png' })
})

test('apple touch icon', async ({ page }) => {
  const svg = readFileSync('public/favicon.svg', 'utf8')
  await page.setViewportSize({ width: 180, height: 180 })
  await page.setContent(`<style>html,body{margin:0;background:#1d4f91}svg{width:180px;height:180px;display:block}</style>${svg}`)
  await page.screenshot({ path: 'public/apple-touch-icon.png' })
})

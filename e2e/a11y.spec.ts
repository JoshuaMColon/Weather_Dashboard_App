import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mockApi, seedPlaces, type CITIES } from './fixtures'

const cases: Array<[string, keyof typeof CITIES]> = [
  ['clear day', 'cupertino'],
  ['night', 'reykjavik'],
  ['rain', 'london'],
  ['snow', 'sapporo'],
]

for (const [label, city] of cases) {
  test(`no WCAG A/AA violations: ${label}`, async ({ page }) => {
    await mockApi(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedPlaces(page, [city], city)
    await page.goto('/')
    await expect(page.getByTestId('tiles')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([])
  })
}

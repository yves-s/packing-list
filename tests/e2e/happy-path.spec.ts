import { test, expect, chromium } from '@playwright/test'

test('A creates trip; B joins via link; B claims; A sees claim', async () => {
  const browser = await chromium.launch()
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.getByPlaceholder('Z. B. Bodensee-Wochenende').fill('Test-Tour')
  await a.locator('input[name=date_from]').fill('2026-06-01')
  await a.locator('input[name=date_to]').fill('2026-06-03')
  await a.getByPlaceholder('Wie heißt du?').first().fill('Anna')
  await a.getByRole('button', { name: 'Tour anlegen' }).click()
  await expect(a).toHaveURL(/\/t\/[A-Z2-9]{6}$/)
  const code = a.url().split('/').pop()!

  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto(`/t/${code}/join`)
  await b.getByPlaceholder('Dein Name').fill('Bert')
  await b.getByRole('button', { name: 'Beitreten' }).click()
  await expect(b).toHaveURL(`/t/${code}`)

  // B claims the Zelt item (template seeds quantity_needed=2).
  const zeltCard = b.locator('div', { hasText: 'Zelt' }).filter({ hasText: '0 / 2 zugesagt' }).first()
  await expect(zeltCard).toBeVisible()
  await zeltCard.click()
  await b.getByRole('button', { name: 'Ich bring eins' }).click()
  await b.keyboard.press('Escape')
  await expect(b.locator('div', { hasText: 'Zelt' }).filter({ hasText: '1 / 2 zugesagt' }).first()).toBeVisible()

  await a.reload()
  await expect(a.locator('div', { hasText: 'Zelt' }).filter({ hasText: '1 / 2 zugesagt' }).first()).toBeVisible()

  await browser.close()
})

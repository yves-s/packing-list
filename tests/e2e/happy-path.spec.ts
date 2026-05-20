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
  // Card shows compact "0/2" counter; open the sheet which shows "0 / 2 zugesagt".
  const zeltCard = b.getByRole('button').filter({ hasText: /^Zelt\s*0\/2/ }).first()
  await expect(zeltCard).toBeVisible()
  await zeltCard.click()
  await b.getByRole('button', { name: 'Ich bring eins' }).click()
  // After claim, the sheet shows "1 / 2 zugesagt"
  await expect(b.getByText('1 / 2 zugesagt').first()).toBeVisible()
  await b.keyboard.press('Escape')
  // Back on the list, the Zelt card now shows "1/2"
  await expect(b.getByRole('button').filter({ hasText: /^Zelt\s*1\/2/ }).first()).toBeVisible()

  await a.reload()
  await expect(a.getByRole('button').filter({ hasText: /^Zelt\s*1\/2/ }).first()).toBeVisible()

  await browser.close()
})

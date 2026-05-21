import { test, expect, chromium } from '@playwright/test'

// Unique-per-run emails. The "email exists in trip" branch reuses the
// existing participant (cookie swap), which is a separate happy path
// not exercised here. Fresh emails per run avoid cross-run pollution
// in the shared remote Supabase project.
const RUN_ID = Date.now()
const ANNA_EMAIL = `anna+${RUN_ID}@e2e.test`
const BERT_EMAIL = `bert+${RUN_ID}@e2e.test`

test('A creates trip; B joins via link; B claims; A sees claim', async () => {
  const browser = await chromium.launch()
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.getByPlaceholder('Z. B. Bodensee-Wochenende').fill('Test-Tour')
  await a.locator('input[name=date_from]').fill('2026-06-01')
  await a.locator('input[name=date_to]').fill('2026-06-03')
  await a.getByPlaceholder('Wie heißt du?').first().fill('Anna')
  await a.locator('input[name=email]').first().fill(ANNA_EMAIL)
  await a.getByRole('button', { name: 'Tour anlegen' }).click()
  await expect(a).toHaveURL(/\/t\/[A-Z2-9]{6}$/)
  const code = a.url().split('/').pop()!

  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto(`/t/${code}/join`)
  await b.getByPlaceholder('Wie heißt du?').fill('Bert')
  await b.locator('input[name=email]').fill(BERT_EMAIL)
  await b.getByRole('button', { name: 'Beitreten' }).click()
  await expect(b).toHaveURL(`/t/${code}`)

  // B claims the Zelt item (template seeds quantity_needed=2).
  const zeltCard = b.getByRole('button').filter({ hasText: /^Zelt\s*0\/2/ }).first()
  await expect(zeltCard).toBeVisible()
  await zeltCard.click()
  await b.getByRole('button', { name: 'Ich bring eins' }).click()
  await expect(b.getByText('1 / 2 zugesagt').first()).toBeVisible()
  await b.keyboard.press('Escape')
  await expect(b.getByRole('button').filter({ hasText: /^Zelt\s*1\/2/ }).first()).toBeVisible()

  await a.reload()
  await expect(a.getByRole('button').filter({ hasText: /^Zelt\s*1\/2/ }).first()).toBeVisible()

  await browser.close()
})

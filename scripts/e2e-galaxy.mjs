// Galaxy e2e: portal round-trip, per-body cards with correct status language,
// the secret stays unlabeled, a11y proxies, screenshots.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const exe = process.env.PW_EXE
const works = JSON.parse(readFileSync('content/works.json', 'utf8'))
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1800))

let failures = 0
const check = (ok, msg) => { console.log(`${ok ? '  ok' : 'FAIL'} — ${msg}`); if (!ok) failures++ }

try {
  mkdirSync('shots', { recursive: true })
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter') // skip intro

  // ---- dive through the monitor ----
  await page.focus('.hotspot-proxies button[data-hotspot="monitor"]')
  await page.keyboard.press('Enter')
  const galaxyUp = await page.waitForSelector('#galaxy-root canvas', { timeout: 8000 }).then(() => true).catch(() => false)
  check(galaxyUp, 'monitor dives into the galaxy')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'shots/galaxy-desktop.png' })

  const idsInWorld = await page.evaluate(() => window.__galaxy?.bodyIds || [])
  check(idsInWorld.length === works.length + 1, `registry = ${works.length} works + secret (got ${idsInWorld.length})`)

  // ---- every work card, with the right status language ----
  const phrase = { review: 'igniting', published: '', ongoing: 'in progress', paused: 'dormant' }
  for (const w of works) {
    await page.focus(`.hotspot-proxies button[data-body="${w.id}"]`)
    await page.keyboard.press('Enter')
    const card = await page.waitForSelector('.card-backdrop .card', { timeout: 4000 }).catch(() => null)
    if (!card) { check(false, `${w.id}: card opens`); continue }
    const body = (await card.innerText()).toLowerCase()
    const okTitle = body.includes(w.title.slice(0, 30).toLowerCase())
    const okPhrase = !phrase[w.status] || body.includes(phrase[w.status])
    check(okTitle && okPhrase, `${w.id}: card shows title + "${phrase[w.status] || w.venue}"`)
    if (w.id === 'paper-svg') await page.screenshot({ path: 'shots/galaxy-card-dormant.png' })
    await page.keyboard.press('Escape')
    await page.waitForSelector('.card-backdrop', { state: 'detached', timeout: 3000 })
    await page.waitForTimeout(1100)
  }

  // ---- the secret nebula ----
  await page.focus('.hotspot-proxies button[data-body="secret"]')
  await page.keyboard.press('Enter')
  const secretCard = await page.waitForSelector('.card-backdrop .card', { timeout: 4000 }).catch(() => null)
  if (secretCard) {
    const txt = await secretCard.innerText()
    check(/idea nebula/i.test(txt) && txt.includes('Placeholder topic A'), 'secret: idea archive opens with topics')
    await page.screenshot({ path: 'shots/galaxy-secret.png' })
  } else check(false, 'secret: card opens')
  await page.keyboard.press('Escape')
  await page.waitForSelector('.card-backdrop', { state: 'detached', timeout: 3000 })
  await page.waitForTimeout(1100)

  // the word "secret" must never be rendered anywhere in the world UI
  const domText = await page.evaluate(() => document.body.innerText)
  check(!/secret/i.test(domText), 'the word "secret" appears nowhere on screen')

  // ---- back to desk without intro replay ----
  await page.click('#back-desk')
  const deskBack = await page.waitForSelector('#desk-root canvas', { timeout: 8000 }).then(() => true).catch(() => false)
  const noSkipBtn = !(await page.$('.skip-intro'))
  check(deskBack && noSkipBtn, 'back to desk, no intro replay')

  const benign = /favicon|Autoplay|preload/i
  const realErrors = errors.filter(e => !benign.test(e))
  check(realErrors.length === 0, `no console errors (${realErrors.slice(0, 2).join(' | ') || 'clean'})`)
  await page.close()

  // ---- phone screenshot ----
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await phone.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await phone.waitForSelector('#desk-root canvas', { timeout: 6000 }).catch(() => {})
  await phone.keyboard.press('Enter')
  await phone.focus('.hotspot-proxies button[data-hotspot="monitor"]')
  await phone.keyboard.press('Enter')
  await phone.waitForSelector('#galaxy-root canvas', { timeout: 8000 }).catch(() => {})
  await phone.waitForTimeout(1500)
  await phone.screenshot({ path: 'shots/galaxy-phone.png' })
  await phone.close()
  await browser.close()
} finally {
  preview.kill()
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED')
process.exit(failures ? 1 : 0)

// Desk world e2e: mounts, hotspots work, cards open, privacy rule holds,
// classic toggle round-trips, no-WebGL stays classic. Saves screenshots.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const exe = process.env.PW_EXE
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1800))

let failures = 0
const check = (ok, msg) => {
  console.log(`${ok ? '  ok' : 'FAIL'} — ${msg}`)
  if (!ok) failures++
}

try {
  mkdirSync('shots', { recursive: true })
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  })

  // ---------- main run ----------
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  const canvasOk = await page.waitForSelector('#desk-root canvas', { timeout: 6000 }).then(() => true).catch(() => false)
  check(canvasOk, 'world canvas mounts within budget')

  // skip intro
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'shots/desk-desktop.png' })

  const proxies = await page.$$('.hotspot-proxies button')
  check(proxies.length === 14, `14 hotspot proxies present (got ${proxies.length})`)

  // monitor + handheld are portals now — covered by e2e-galaxy / e2e-village
  const expectText = {
    tray: 'Curriculum',
    frame: 'July 16', notes: 'Insomania Radio', musicbox: '静止',
    plant: 'childhood', keyboard: 'board', board: 'message board',
    mouse: 'DPI 1600 * 0.23', candle: 'Le Labo 25', shelf: 'nothing there', headphones: 'Volume: 001'
  }
  // proxies are keyboard controls: activate via focus + Enter (the real a11y path)
  const pressProxy = async (id) => {
    await page.focus(`.hotspot-proxies button[data-hotspot="${id}"]`)
    await page.keyboard.press('Enter')
  }
  for (const [id, text] of Object.entries(expectText)) {
    await pressProxy(id)
    const card = await page.waitForSelector('.card-backdrop .card', { timeout: 9000 }).catch(() => null)
    if (!card) { check(false, `${id}: card opens`); continue }
    const body = await card.innerText()
    check(body.toLowerCase().includes(text.toLowerCase()), `${id}: card mentions "${text}"`)
    if (id !== 'frame') check(!/july\s*16|07-16/i.test(body), `${id}: no birthday leak`)
    if (id === 'frame') await page.screenshot({ path: 'shots/desk-card-about.png' })
    await page.keyboard.press('Escape')
    await page.waitForSelector('.card-backdrop', { state: 'detached', timeout: 6000 })
    await page.waitForTimeout(1200)
  }

  // keyboard → board: words are pinned, never typed onto the screen
  await pressProxy('keyboard')
  await page.waitForSelector('.wall-input', { timeout: 9000 })
  await page.fill('.wall-input', 'hello from the e2e ghost')
  await page.click('[data-pin-board]')
  await page.waitForSelector('.card-backdrop', { state: 'detached', timeout: 4000 })
  const toastShown = await page.waitForSelector('.desk-toast.on', { timeout: 3000 }).then(() => true).catch(() => false)
  check(toastShown, 'pinning shows a small confirmation')
  const nothingTyped = await page.evaluate(() => localStorage.getItem('davidworld:typed') === null)
  check(nothingTyped, 'nothing is written onto the screen any more')
  await page.waitForTimeout(1400)
  await pressProxy('board')
  await page.waitForSelector('.board-msg', { timeout: 9000 })
  const boardText = await page.$eval('.card.boardcard', el => el.innerText)
  const flat = boardText.replace(/\s+/g, ' ')
  check(/匿名：\s?hello from the e2e ghost\s?—— \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(flat), `the board shows 匿名：message —— time (${flat.slice(0, 90)})`)
  await page.screenshot({ path: 'shots/desk-board.png' })
  await page.keyboard.press('Escape')
  await page.waitForSelector('.card-backdrop', { state: 'detached', timeout: 6000 })
  await page.waitForTimeout(1200)

  // mug: no card, just the heart
  await pressProxy('mug')
  await page.waitForTimeout(900)
  const mugCard = await page.$('.card-backdrop')
  check(!mugCard, 'mug: heart burst, no card')
  await page.screenshot({ path: 'shots/desk-heart.png' })

  // classic toggle round-trip
  await page.click('#classic-toggle')
  await page.waitForTimeout(400)
  const canvasGone = !(await page.$('#desk-root canvas'))
  const classicVisible = await page.$eval('.classic h1', (el) => !!el.offsetParent).catch(() => false)
  check(canvasGone && classicVisible, 'classic toggle exits the world')
  await page.click('#enter-world')
  const canvasBack = await page.waitForSelector('#desk-root canvas', { timeout: 6000 }).then(() => true).catch(() => false)
  check(canvasBack, 're-entering the world works')
  await page.keyboard.press('Enter')

  const benign = /favicon|Autoplay|preload/i
  const realErrors = errors.filter(e => !benign.test(e))
  check(realErrors.length === 0, `no console errors (${realErrors.slice(0, 3).join(' | ') || 'clean'})`)
  await page.close()

  // ---------- phone screenshot ----------
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await phone.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await phone.waitForSelector('#desk-root canvas', { timeout: 6000 }).catch(() => {})
  await phone.keyboard.press('Enter')
  await phone.waitForTimeout(500)
  await phone.screenshot({ path: 'shots/desk-phone.png' })
  await phone.close()

  await browser.close()

  // ---------- no-WebGL run ----------
  const noGl = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ['--no-sandbox', '--disable-webgl', '--disable-webgl2']
  })
  const p2 = await noGl.newPage({ viewport: { width: 1280, height: 900 } })
  const errs2 = []
  p2.on('pageerror', (e) => errs2.push(String(e)))
  await p2.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p2.waitForTimeout(1200)
  const noCanvas = !(await p2.$('#desk-root canvas'))
  const classicOk = await p2.$eval('.classic h1', (el) => el.textContent.includes('Zhang')).catch(() => false)
  check(noCanvas && classicOk && errs2.length === 0, 'no-WebGL visitors get classic, error-free')
  await noGl.close()
} finally {
  preview.kill()
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED')
process.exit(failures ? 1 : 0)

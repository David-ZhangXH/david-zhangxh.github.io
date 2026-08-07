// Village e2e: portal, lock (wrong→nudge→0716), walking, every zone's panel,
// arcade record-reveal rule, letter mailto, quests, unlock persistence, exit.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const exe = process.env.PW_EXE
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')

  // ---- handheld portal → lock ----
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')
  const lockUp = await page.waitForSelector('.v-lock', { timeout: 9000 }).then(() => true).catch(() => false)
  check(lockUp, 'handheld dives into the lock screen')
  await page.screenshot({ path: 'shots/village-lock.png' })

  // ---- three misses → nudge ----
  const typeCode = async (code) => {
    for (let i = 0; i < 4; i++) await page.fill(`.v-code input[data-d="${i}"]`, code[i])
    await page.click('[data-try]')
  }
  await typeCode('1111')
  await typeCode('2222')
  let nudgeVisible = await page.$eval('.v-nudge', el => !el.hidden).catch(() => false)
  check(!nudgeVisible, 'no nudge before the third miss')
  await typeCode('3333')
  nudgeVisible = await page.$eval('.v-nudge', el => !el.hidden)
  const nudgeText = await page.$eval('.v-nudge', el => el.textContent)
  check(nudgeVisible && /photo frame/i.test(nudgeText), 'third miss nudges toward the photo frame')

  // ---- 0716 opens the town ----
  await typeCode('0716')
  const townUp = await page.waitForSelector('#village-root canvas', { timeout: 6000 }).then(() => true).catch(() => false)
  check(townUp, 'passcode 0716 opens the town')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'shots/village-town.png' })

  // ---- walking works ----
  const posOf = () => page.evaluate(() => ({ x: window.__village.player.tx, y: window.__village.player.ty }))
  const p0 = await posOf()
  await page.keyboard.down('ArrowLeft')
  await page.waitForTimeout(700)
  await page.keyboard.up('ArrowLeft')
  const p1 = await posOf()
  check(p1.x < p0.x, `arrow keys walk the player (${p0.x},${p0.y} → ${p1.x},${p1.y})`)

  // helper: teleport-free walking via key holds is slow; drive to zones with a route runner
  async function walkTo(tx, ty) {
    await page.evaluate(([tx, ty]) => { // small dev assist: nudge tile-by-tile via keys only would take minutes headless
      const v = window.__village.player
      v.tx = tx; v.ty = ty; v.px = tx * 16; v.py = ty * 16
    }, [tx, ty])
    await page.waitForTimeout(120)
  }
  async function face(dx, dy) {
    const key = dx === 1 ? 'ArrowRight' : dx === -1 ? 'ArrowLeft' : dy === -1 ? 'ArrowUp' : 'ArrowDown'
    await page.keyboard.down(key) // hold across a few frames so the loop registers facing
    await page.waitForTimeout(320)
    await page.keyboard.up(key)
    await page.waitForTimeout(120)
  }
  const openZone = async (standX, standY, dx, dy) => {
    await walkTo(standX, standY)
    await face(dx, dy)
    await page.keyboard.press('e')
    return page.waitForSelector('.v-panel', { timeout: 4000 }).catch(() => null)
  }
  const closePanel = async () => {
    await page.keyboard.press('Escape')
    await page.waitForSelector('.v-overlay', { state: 'detached', timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(150)
  }

  // ---- buildings ----
  const zonesToTest = [
    { name: 'school', stand: [7, 9], dir: [0, -1], expect: /SCHOOL DAYS/i },
    { name: 'home', stand: [7, 19], dir: [0, -1], expect: /HOME/ },
    { name: 'lab', stand: [28, 9], dir: [0, -1], expect: /THE LAB/i },
    { name: 'library', stand: [28, 19], dir: [0, -1], expect: /THE LIBRARY/i }
  ]
  for (const z of zonesToTest) {
    const panel = await openZone(...z.stand, ...z.dir)
    if (!panel) { check(false, `${z.name}: panel opens`); continue }
    const txt = await panel.innerText()
    check(z.expect.test(txt), `${z.name}: panel shows its content`)
    if (z.name === 'lab') check(/asleep/.test(txt) && /running/.test(txt), 'lab: machines show running + asleep states')
    if (z.name === 'school') await page.screenshot({ path: 'shots/village-school.png' })
    await closePanel()
  }

  // ---- arcade: record only after start ----
  const bodyBefore = await page.evaluate(() => document.body.innerText)
  check(!bodyBefore.includes('26.00'), 'record nowhere on screen before the arcade starts')
  const arcadePanel = await openZone(31, 9, 1, 0)
  if (arcadePanel) {
    const startTxt = await arcadePanel.innerText()
    check(/26\.00/.test(startTxt) && /middle school/i.test(startTxt), 'start screen reveals the 26.00s record')
    await page.click('[data-start]')
    const grid = await page.waitForSelector('.v-grid', { timeout: 3000 }).catch(() => null)
    check(!!grid, 'puzzle board opens')
    const movesBefore = await page.$eval('[data-moves]', el => el.textContent)
    for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp']) await page.keyboard.press(k)
    await page.waitForTimeout(200)
    const movesAfter = await page.$eval('[data-moves]', el => el.textContent)
    const timer = await page.$eval('[data-timer]', el => el.textContent)
    check(movesBefore !== movesAfter && parseFloat(timer) > 0, `arrows slide tiles, timer runs (${movesAfter}, ${timer}s)`)
    await page.screenshot({ path: 'shots/village-arcade.png' })
    await closePanel()
  } else check(false, 'arcade: start screen opens')

  // ---- coffee machine quest ----
  await walkTo(37, 7)
  await face(0, -1)
  await page.keyboard.press('e')
  const toast = await page.waitForSelector('.v-toast', { timeout: 3000 }).catch(() => null)
  check(!!toast, 'hidden coffee machine grants its quest')
  await page.waitForTimeout(2800)

  // ---- mailbox letter ----
  const letterPanel = await openZone(21, 13, 0, -1)
  if (letterPanel) {
    await page.fill('.v-letter', 'Hello David! Your village is lovely.')
    const mailtoPromise = page.waitForEvent('framenavigated', { timeout: 2500 }).catch(() => null)
    await page.click('[data-send]')
    await mailtoPromise
    const questDone = await page.evaluate(() => JSON.parse(localStorage.getItem('davidworld:quests') || '[]').includes('letter'))
    check(questDone, 'sending the letter completes its quest')
  } else check(false, 'mailbox: letter panel opens')

  // ---- quest log ----
  await page.waitForTimeout(200)
  await page.keyboard.press('q')
  const log = await page.waitForSelector('.v-quests', { timeout: 3000 }).catch(() => null)
  if (log) {
    const txt = await log.innerText()
    check(/passcode/.test(txt) && /coffee/.test(txt), 'quest log lists quests with progress')
    await page.screenshot({ path: 'shots/village-quests.png' })
  } else check(false, 'quest log opens')
  await closePanel()

  // ---- unlock persists across reload ----
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')
  const townDirect = await page.waitForSelector('#village-root canvas', { timeout: 9000 }).then(() => true).catch(() => false)
  const lockAgain = await page.$('.v-lock')
  check(townDirect && !lockAgain, 'unlock is remembered — straight to town on return')

  // ---- exit to desk ----
  await page.keyboard.press('Escape')
  await page.click('[data-leave]')
  const deskBack = await page.waitForSelector('#desk-root canvas', { timeout: 9000 }).then(() => true).catch(() => false)
  check(deskBack, 'putting the handheld down returns to the desk')

  const benign = /favicon|Autoplay|preload|mailto/i
  const realErrors = errors.filter(e => !benign.test(e))
  check(realErrors.length === 0, `no console errors (${realErrors.slice(0, 2).join(' | ') || 'clean'})`)

  await browser.close()
} finally {
  preview.kill()
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED')
process.exit(failures ? 1 : 0)

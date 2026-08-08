// Village 2.0 e2e: lock, one-screen town, click-to-move, interiors with
// David's objects, memory gate, library quiz→prize, arcade text, exits.
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')

  // ---- lock ----
  await page.waitForSelector('.v-lock', { timeout: 15000 })
  const typeCode = async (code) => {
    for (let i = 0; i < 4; i++) await page.fill(`.v-code input[data-d="${i}"]`, code[i])
    await page.click('[data-try]')
  }
  await typeCode('1111'); await typeCode('2222'); await typeCode('3333')
  const nudge = await page.$eval('.v-nudge', el => !el.hidden)
  check(nudge, 'three misses nudge toward the photo frame')
  await typeCode('0716')
  await page.waitForSelector('#village-root canvas', { timeout: 6000 })
  check(true, 'passcode opens the town')
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'shots/village-town.png' })

  const state = () => page.evaluate(() => ({ scene: window.__village.scene, x: window.__village.player.tx, y: window.__village.player.ty }))
  const tilePoint = (tx, ty) => page.evaluate(([tx, ty]) => {
    const c = document.querySelector('#village-root canvas')
    const r = c.getBoundingClientRect()
    // recompute the letterbox view like the renderer does
    const TILE = 16, w = 26, h = 16
    const fit = Math.floor(Math.min(c.width / (w * TILE), c.height / (h * TILE)))
    const scale = Math.min(4, fit)
    const ox = Math.floor((c.width - w * TILE * scale) / 2)
    const oy = Math.floor((c.height - h * TILE * scale) / 2)
    return [r.left + ox + (tx * TILE + 8) * scale, r.top + oy + (ty * TILE + 8) * scale]
  }, [tx, ty])
  const clickTile = async (tx, ty) => {
    const pt = await tilePoint(tx, ty)
    await page.mouse.click(pt[0], pt[1])
  }
  const waitScene = async (name, ms = 9000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      if ((await state()).scene === name) return true
      await page.waitForTimeout(150)
    }
    return false
  }
  const closePanel = async () => {
    await page.keyboard.press('Escape')
    await page.waitForSelector('.v-overlay', { state: 'detached', timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(150)
  }
  const enterVia = (name, at) => page.evaluate(([n, a]) => window.__village.go(n, a), [name, at])
  const openZoneByKeys = async (standX, standY, dirKey) => {
    await page.evaluate(([x, y]) => {
      const v = window.__village.player
      v.tx = x; v.ty = y; v.px = x * 16; v.py = y * 16
    }, [standX, standY])
    await page.keyboard.down(dirKey); await page.waitForTimeout(350); await page.keyboard.up(dirKey)
    await page.waitForTimeout(120)
    await page.keyboard.press('e')
    return page.waitForSelector('.v-panel', { timeout: 5000 }).catch(() => null)
  }

  // ---- hover shows a pointer over interactables ----
  const doorPt = await tilePoint(5, 12)
  await page.mouse.move(doorPt[0], doorPt[1])
  await page.waitForTimeout(150)
  const cursor = await page.$eval('#village-root canvas', el => el.style.cursor)
  check(cursor === 'pointer', 'hovering an interactable shows a pointer cursor')

  // ---- click a door → auto-walk → auto-enter ----
  await clickTile(5, 12) // home door
  check(await waitScene('home'), 'clicking the HOME door walks in and enters the room')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'shots/village-home.png' })

  // ---- home objects (new spread layout) ----
  const homeChecks = [
    { stand: [2, 3], dir: 'ArrowUp', text: /Love can fight everything/i, name: 'musicbox' },
    { stand: [4, 6], dir: 'ArrowDown', text: /guitar/i, name: 'music corner' },
    { stand: [8, 5], dir: 'ArrowRight', text: /trajectory|big book/i, name: 'big book' },
    { stand: [10, 3], dir: 'ArrowUp', text: /messi|fernandes|westbrook/i, name: 'jersey wall' }
  ]
  for (const c of homeChecks) {
    const panel = await openZoneByKeys(...(c.pre || c.stand), c.dir)
    if (!panel) { check(false, `home: ${c.name} opens`); continue }
    check(c.text.test(await panel.innerText()), `home: ${c.name} opens its story`)
    await closePanel()
  }
  // music box: genres + favourite artists + loved artists all present
  const mb = await openZoneByKeys(2, 3, 'ArrowUp')
  if (mb) {
    const mt = await mb.innerText()
    check(['Neo-Soul', 'Future Bass', 'Flamenco'].every(x => mt.includes(x)), 'music box: the nine sounds are listed')
    check(['王以太', '艾热', 'Gali', 'Linkin Park', '大张伟', '邓紫棋'].every(x => mt.includes(x)), 'music box: six favourite artists shine')
    check(['Kendrick Lamar', 'Molchat Doma', '方大同', 'Imagine Dragons'].every(x => mt.includes(x)), 'music box: the loved-music list plays')
    await closePanel()
  } else check(false, 'music box reopens')

  // jersey wall carries all four numbers
  const jp = await openZoneByKeys(10, 3, 'ArrowUp')
  if (jp) {
    const jt = await jp.innerText()
    check(['#8', '#10', '#13', '#0'].every(n => jt.includes(n)), 'jersey wall: all four numbers hang')
    await closePanel()
  } else check(false, 'jersey wall reopens')
  // world map (left wall now)
  const wm = await openZoneByKeys(2, 4, 'ArrowLeft')
  check(wm && /where david has been|travelling world map/i.test(await wm.innerText()), 'home: world map lists stops')
  await closePanel()

  // ---- memory placard gate (right wall now) ----
  const gate = await openZoneByKeys(11, 7, 'ArrowRight')
  if (gate) {
    await page.fill('.v-answer', 'wrongname')
    await page.click('[data-try-memory]')
    const nudged = await page.$eval('.v-nudge2', el => !el.hidden)
    check(nudged, 'memory: wrong nickname is refused')
    await page.fill('.v-answer', '花花')
    await page.click('[data-try-memory]')
    await page.waitForTimeout(400)
    const revealed = await page.$eval('.v-panel', el => /secret memory/i.test(el.innerText)).catch(() => false)
    const questDone = await page.evaluate(() => JSON.parse(localStorage.getItem('davidworld:quests') || '[]').includes('memory'))
    check(revealed && questDone, 'memory: 花花 unlocks the placard + quest')
    await closePanel()
  } else check(false, 'memory: gate opens')

  // ---- exit home by stepping on the mat ----
  await page.evaluate(() => { const v = window.__village.player; v.tx = 7; v.ty = 7; v.px = 7 * 16; v.py = 7 * 16 })
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(500); await page.keyboard.up('ArrowDown')
  check(await waitScene('town'), 'walking onto the door mat returns to town')

  // ---- school + lab + library rooms ----
  await enterVia('school'); await page.waitForTimeout(300)
  const yy = await openZoneByKeys(3, 3, 'ArrowUp')
  check(yy && /yuying/i.test(await yy.innerText()), 'school: Yuying station opens')
  await closePanel()
  await page.screenshot({ path: 'shots/village-school.png' })

  await enterVia('lab'); await page.waitForTimeout(300)
  const chem = await openZoneByKeys(7, 4, 'ArrowUp')
  check(chem && /chemistry/i.test(await chem.innerText()), 'lab: Chemistry table opens')
  await closePanel()
  await page.screenshot({ path: 'shots/village-lab.png' })

  await enterVia('library'); await page.waitForTimeout(300)
  const docs = await openZoneByKeys(4, 3, 'ArrowUp')
  check(docs && /document/i.test(await docs.innerText()), 'library: document shelves open')
  await closePanel()

  // quiz: answer the three correct answers → prize
  const quiz = await openZoneByKeys(11, 5, 'ArrowUp')
  if (quiz) {
    for (const label of ['Linkin Park', 'Insomania Radio', 'huahua']) {
      await page.waitForSelector('.v-options', { timeout: 4000 })
      await page.click(`.v-options button:has-text("${label}")`)
      await page.waitForTimeout(250)
    }
    const prize = await page.waitForSelector('.v-panel', { timeout: 4000 }).catch(() => null)
    const ptxt = prize ? await prize.innerText() : ''
    const questDone = await page.evaluate(() => JSON.parse(localStorage.getItem('davidworld:quests') || '[]').includes('quiz'))
    check(/3 \/ 3|really know him/i.test(ptxt) && questDone, 'library: perfect quiz wins the prize + quest')
    await page.screenshot({ path: 'shots/village-prize.png' })
    await closePanel()
  } else check(false, 'library: quiz opens')

  // ---- arcade text rules (in town) ----
  await enterVia('town', { x: 14, y: 5 })
  await page.waitForTimeout(200)
  const bodyBefore = await page.evaluate(() => document.body.innerText)
  check(!bodyBefore.includes('26.00'), 'record nowhere before the arcade opens')
  const arc = await openZoneByKeys(14, 5, 'ArrowUp')
  if (arc) {
    const t = await arc.innerText()
    check(/Middle School record — 26\.00s/.test(t), 'arcade: record line reads exactly as David wrote')
    check(/beat my record and win a secret prize/i.test(t), 'arcade: secret-prize line present')
    check(/Slide the numbered tiles/i.test(t) && !/flickers to life/i.test(t), 'arcade: plain rules, no flavor text')
    await closePanel()
  } else check(false, 'arcade: start screen opens')

  // ---- mailbox letter (town) ----
  const letter = await openZoneByKeys(12, 9, 'ArrowUp')
  if (letter) {
    await page.fill('.v-letter', 'Village 2.0 is lovely.')
    const nav = page.waitForEvent('framenavigated', { timeout: 2500 }).catch(() => null)
    await page.click('[data-send]')
    await nav
    check(await page.evaluate(() => JSON.parse(localStorage.getItem('davidworld:quests') || '[]').includes('letter')), 'mailbox letter completes its quest')
  } else check(false, 'mailbox opens')

  // ---- the corner button goes back to the desk ----
  await page.click('#village-exit')
  await page.waitForSelector('#desk-root canvas', { timeout: 9000 }).catch(() => {})
  const backAtDesk = !!(await page.$('#desk-root canvas')) && !(await page.$('#village-root'))
  check(backAtDesk, 'the corner button walks you back to the desk')

  const benign = /favicon|Autoplay|preload|mailto/i
  const realErrors = errors.filter(e => !benign.test(e))
  check(realErrors.length === 0, `no console errors (${realErrors.slice(0, 2).join(' | ') || 'clean'})`)
  await browser.close()
} finally {
  preview.kill()
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED')
process.exit(failures ? 1 : 0)

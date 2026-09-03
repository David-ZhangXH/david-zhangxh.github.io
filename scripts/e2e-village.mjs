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
    { stand: [4, 6], dir: 'ArrowDown', text: /rock star/i, name: 'music corner' },
    { stand: [8, 5], dir: 'ArrowRight', text: /Born in 2002/i, name: 'big book' },
    { stand: [1, 3], dir: 'ArrowUp', text: /great power comes great responsibility/i, name: 'iron man poster' },
    { stand: [10, 3], dir: 'ArrowUp', text: /messi|fernandes|westbrook/i, name: 'jersey wall' },
    { stand: [4, 3], dir: 'ArrowUp', text: /Stranger Things/i, name: 'television' },
    { stand: [7, 3], dir: 'ArrowUp', text: /Hearthstone rank 50/i, name: 'gaming laptop' },
    { stand: [11, 4], dir: 'ArrowRight', text: /查理九世/i, name: 'book-shelves' },
    { stand: [12, 3], dir: 'ArrowUp', text: /Insomania Radio/i, name: 'video tape' },
    { stand: [9, 6], dir: 'ArrowDown', text: /骆驼大赛/i, name: 'table games' },
    { stand: [10, 6], dir: 'ArrowDown', text: /围棋三段/i, name: 'go board' }
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
    await page.waitForTimeout(600) // let covers load
    const covers = await page.$$eval('.v-album img', els => els.map(i => ({ w: i.naturalWidth, src: i.src })))
    check(covers.length === 6 && covers.every(c => c.w > 0), `music box: all six album covers render (${covers.filter(c => c.w > 0).length}/6)`)
    await closePanel()
  } else check(false, 'music box reopens')

  // world map: China → cities → 北京 (photos coming); the picture board asks for the birthday
  const wmPanel = await openZoneByKeys(2, 4, 'ArrowLeft')
  if (wmPanel) {
    let t = await wmPanel.innerText()
    check(/China/.test(t) && /US/.test(t) && /Next stop/.test(t) && !/北京/.test(t), 'world map: countries + single stops at the root')
    await page.click('.v-wm [data-wm-group="0"]')
    t = await wmPanel.innerText()
    check(/北京/.test(t) && /香港/.test(t), 'world map: China opens into his cities')
    await page.click('.v-wm [data-wm-place="0"]')
    t = await wmPanel.innerText()
    check(/growing up/.test(t) && /Photos coming/.test(t), 'world map: 北京 shows its photo slot')
    await page.click('.v-wm [data-wm-back]')
    t = await wmPanel.innerText()
    check(/China/.test(t) && !/北京/.test(t), 'world map: World breadcrumb goes back')
    await page.click('.v-wm [data-wm-stop="4"]')
    await page.waitForTimeout(1500)
    const nzPhotos = await page.$$eval('.v-wm .v-photo img', els => els.map(i => i.naturalWidth > 0))
    check(nzPhotos.length === 10 && nzPhotos.every(Boolean), `world map: all ten New Zealand photos render (${nzPhotos.filter(Boolean).length}/10)`)
    await page.click('.v-wm [data-wm-back]')
    await page.screenshot({ path: 'shots/village-worldmap.png' })
    await closePanel()
  } else check(false, 'world map opens')
  await page.evaluate(() => localStorage.removeItem('davidworld:board-open'))
  const pbGate = await openZoneByKeys(2, 7, "ArrowLeft")
  if (pbGate) {
    const gt = await pbGate.innerText()
    check(/birthday-month-day/.test(gt) && !/0716/.test(gt), 'picture board: locked, hint only')
    for (let i = 0; i < 4; i++) await page.fill(`.v-gate .v-code input[data-d="${i}"]`, '1234'[i])
    await page.click('[data-try-board]')
    await page.waitForTimeout(200)
    check(!!(await page.$('.v-gate')), 'picture board: wrong code stays locked')
    for (let i = 0; i < 4; i++) await page.fill(`.v-gate .v-code input[data-d="${i}"]`, '0716'[i])
    await page.click('[data-try-board]')
    await page.waitForTimeout(300)
    const opened = await page.$eval('.v-panel', el => el.innerText).catch(() => '')
    check(/Picture board/.test(opened) && /Middle School/.test(opened) && /Future/.test(opened), 'picture board: the birthday opens it to its five sections')
    await page.click('.v-pb [data-pb-section="0"]')
    await page.waitForTimeout(1500)
    const midPhotos = await page.$$eval('.v-pb .v-photo img', els => els.map(i => i.naturalWidth > 0))
    check(midPhotos.length === 12 && midPhotos.every(Boolean), `picture board: all twelve Middle School photos render (${midPhotos.filter(Boolean).length}/12)`)
    await page.screenshot({ path: 'shots/village-pboard.png' })
    await page.click('.v-pb [data-pb-back]')
    await page.click('.v-pb [data-pb-section="1"]')
    await page.waitForTimeout(1500)
    const hsPhotos = await page.$$eval('.v-pb .v-photo img', els => els.map(i => i.naturalWidth > 0))
    check(hsPhotos.length === 24 && hsPhotos.every(Boolean), `picture board: all 24 High School photos render (${hsPhotos.filter(Boolean).length}/24)`)
    await page.click('.v-pb [data-pb-back]')
    await page.click('.v-pb [data-pb-section="2"]')
    await page.waitForTimeout(1500)
    const uniPhotos = await page.$$eval('.v-pb .v-photo img', els => els.map(i => i.naturalWidth > 0))
    check(uniPhotos.length === 21 && uniPhotos.every(Boolean), `picture board: all 21 University photos render (${uniPhotos.filter(Boolean).length}/21)`)
    await page.click('.v-pb [data-pb-back]')
    await page.click('.v-pb [data-pb-section="3"]')
    check(/Photos coming/.test(await page.$eval('.v-pb', el => el.innerText)), 'picture board: Life waits for its photos')
    await closePanel()
  } else check(false, 'picture board gate opens')

  // clicking the jersey wall from the bottom row must NOT walk out the door
  const homePoint = (tx, ty) => page.evaluate(([tx, ty]) => {
    const c = document.querySelector('#village-root canvas')
    const r = c.getBoundingClientRect()
    const TILE = 16, w = 14, h = 10
    const fit = Math.floor(Math.min(c.width / (w * TILE), c.height / (h * TILE)))
    const scale = Math.min(4, fit)
    const ox = Math.floor((c.width - w * TILE * scale) / 2)
    const oy = Math.floor((c.height - h * TILE * scale) / 2)
    return [r.left + ox + (tx * TILE + 8) * scale, r.top + oy + (ty * TILE + 8) * scale]
  }, [tx, ty])
  await page.evaluate(() => { const v = window.__village.player; v.tx = 6; v.ty = 8; v.px = 6 * 16; v.py = 8 * 16 })
  const jpt = await homePoint(10, 2)
  await page.mouse.click(jpt[0], jpt[1])
  const jPanel = await page.waitForSelector('.v-panel', { timeout: 9000 }).catch(() => null)
  const stillHome = (await state()).scene === 'home'
  check(stillHome && !!jPanel, 'clicking the jersey wall never walks you out the door')
  await closePanel()

  // the three cats wander at home and answer to a click
  const catInfo = await page.evaluate(() => window.__village.cats.map(c => ({ name: c.name, px: c.px, py: c.py })))
  check(catInfo.length === 4, `three cats + 伯爵 wander here (got ${catInfo.length})`)
  let catClicked = false
  for (let attempt = 0; attempt < 4 && !catClicked; attempt++) {
    const c = await page.evaluate(() => {
      const k = window.__village.cats[0]
      return { tx: Math.round(k.px / 16), ty: Math.round(k.py / 16) }
    })
    const pt = await homePoint(c.tx, c.ty)
    await page.mouse.click(pt[0], pt[1])
    const panel = await page.waitForSelector('.v-panel', { timeout: 2500 }).catch(() => null)
    if (panel && /Tortoiseshell/i.test(await panel.innerText())) catClicked = true
    if (panel) await closePanel()
  }
  check(catClicked, 'clicking Twizzler shows "Twizzler 2023.9, Tortoiseshell"')

  // jersey wall carries all four numbers
  const jp = await openZoneByKeys(10, 3, 'ArrowUp')
  if (jp) {
    const jt = await jp.innerText()
    check(['#8', '#10', '#13', '#0'].every(n => jt.includes(n)), 'jersey wall: all four numbers hang')
    await closePanel()
  } else check(false, 'jersey wall reopens')
  // world map (left wall now)
  const wm = await openZoneByKeys(2, 4, 'ArrowLeft')
  const wmText = wm ? await wm.innerText() : ''
  check(/China/.test(wmText) && /Kyoto/.test(wmText) && /Next stop/.test(wmText) && !/pinned/i.test(wmText), 'home: world map lists his stops, ending with Next stop...')
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
    const heart = !!(await page.$('.v-heart'))
    check(revealed && questDone && heart, 'memory: 花花 unlocks the placard + quest + a red heart')
    await closePanel()
  } else check(false, 'memory: gate opens')

  // ---- exit home by stepping on the mat ----
  await page.evaluate(() => { const v = window.__village.player; v.tx = 7; v.ty = 7; v.px = 7 * 16; v.py = 7 * 16 })
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(500); await page.keyboard.up('ArrowDown')
  check(await waitScene('town'), 'walking onto the door mat returns to town')

  // ---- school + lab + library rooms ----
  await enterVia('school'); await page.waitForTimeout(300)
  const yy = await openZoneByKeys(3, 3, 'ArrowUp')
  const yyText = yy ? await yy.innerText() : ''
  check(/yuying/i.test(yyText) && /Primary School Class 13/.test(yyText) && /Middle School Class 9/.test(yyText), 'school: Yuying tells 2008–2017 in David\'s words')
  check(/朱各庄联队, 12号院，卓展，紫金长安，华熙/.test(yyText), 'school: Yuying footer line exact')
  await page.waitForTimeout(900)
  const yyPhotos = await page.$$eval('.v-photo img', els => els.map(i => i.naturalWidth > 0))
  check(yyPhotos.length === 10 && yyPhotos.every(Boolean), `school: all ten Yuying photos render (${yyPhotos.filter(Boolean).length}/10)`)
  await page.screenshot({ path: 'shots/village-yuying.png' })
  await closePanel()
  const s101 = await openZoneByKeys(7, 3, 'ArrowUp')
  const s101Text = s101 ? await s101.innerText() : ''
  check(/2017–2020 Class 15, Virginia Woolf/.test(s101Text) && /AP Psychology/.test(s101Text) && /AP Physics C/.test(s101Text), 'school: 101 tells Class 15 + the seven APs')
  await page.waitForTimeout(900)
  const s101Photos = await page.$$eval('.v-photo img', els => els.map(i => i.naturalWidth > 0))
  check(s101Photos.length === 5 && s101Photos.every(Boolean), `school: all five 101 photos render (${s101Photos.filter(Boolean).length}/5)`)
  await page.screenshot({ path: 'shots/village-101.png' })
  await closePanel()
  const bu = await openZoneByKeys(11, 3, 'ArrowUp')
  const buText = bu ? await bu.innerText() : ''
  check(/Minor in Chemistry, Biology, and Environmental Science/.test(buText) && /Mathematics & Statistics — B.A./.test(buText) && /Biostatistics — M.S. 2024 — 2026/.test(buText), 'school: BU tells minors + both degrees')
  await page.waitForTimeout(1500)
  const buPhotos = await page.$$eval('.v-photo img', els => els.map(i => i.naturalWidth > 0))
  check(buPhotos.length === 16 && buPhotos.every(Boolean), `school: all sixteen BU photos render (${buPhotos.filter(Boolean).length}/16)`)
  await page.screenshot({ path: 'shots/village-bu.png' })
  await closePanel()
  await page.screenshot({ path: 'shots/village-school.png' })

  await enterVia('lab'); await page.waitForTimeout(300)
  const chem = await openZoneByKeys(5, 4, 'ArrowUp')
  const chemText = chem ? await chem.innerText() : ''
  check(/chemistry/i.test(chemText) && /Intensive Chemistry II/.test(chemText) && /Chemistry in Culture & Society/.test(chemText), 'lab: Chemistry table lists his five courses')
  await closePanel()
  const st = await openZoneByKeys(11, 4, 'ArrowUp')
  const stText = st ? await st.innerText() : ''
  check(/Statistics & Biostatistics/.test(stText) && /B\.A\. level/.test(stText) && /M\.S\. level/.test(stText) && /Causal Inference/.test(stText) && /Estimation Theory/.test(stText), 'lab: Statistics & Biostatistics table shows B.A. + M.S. courses')
  await page.screenshot({ path: 'shots/village-stats.png' })
  await closePanel()
  await page.screenshot({ path: 'shots/village-lab.png' })

  await enterVia('library'); await page.waitForTimeout(300)
  const docs = await openZoneByKeys(4, 3, 'ArrowUp')
  const docsText = docs ? await docs.innerText() : ''
  check(/document/i.test(docsText) && /Hello-world/.test(docsText) && /Life Experience/.test(docsText) && /To be continued/.test(docsText), 'library: the three documents + To be continued')
  if (docs) {
    await page.click('.v-doc summary')
    await page.waitForTimeout(200)
    const opened = await page.$eval('.v-docs', el => el.innerText)
    check(/I am David, 张晓航/.test(opened) && /Enjoy\./.test(opened), 'library: Hello-world opens and reads in his words')
    await page.screenshot({ path: 'shots/village-docs.png' })
  }
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
    await page.waitForTimeout(700)
    const p1 = await page.$eval('.v-page.on img', i => ({ src: i.src, w: i.naturalWidth }))
    check(/prize-01\.jpg$/.test(p1.src) && p1.w > 0, 'prize: page one is 我就sb!')
    await page.screenshot({ path: 'shots/village-prize.png' })
    await page.click('[data-page-next]')
    await page.waitForTimeout(700)
    const p2 = await page.$eval('.v-page.on img', i => i.src)
    const lbl = await page.$eval('[data-page-label]', el => el.textContent)
    check(/prize-02\.jpg$/.test(p2) && lbl === '2 / 2', 'prize: next flips to 我是花花我怕谁啊！')
    const onlyOne = await page.$$eval('.v-page.on', els => els.length)
    check(onlyOne === 1, 'prize: pages never sit side by side')
    await page.screenshot({ path: 'shots/village-prize-2.png' })
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

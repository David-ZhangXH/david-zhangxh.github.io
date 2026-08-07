// Stage-5 polish checks: sound toggle, reduced-motion path, share card, CRT.
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

  // ---- sound toggle on the desk ----
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
    await page.keyboard.press('Enter')
    await page.focus('.hotspot-proxies button[data-hotspot="musicbox"]')
    await page.keyboard.press('Enter')
    await page.waitForSelector('[data-sound]', { timeout: 9000 })
    await page.click('[data-sound]')
    const soundState = await page.evaluate(() => localStorage.getItem('davidworld:sound'))
    const label = await page.$eval('[data-sound]', el => el.textContent)
    check(soundState === 'on' && /rest/.test(label), 'winding the music box turns sound on')
    await page.click('[data-sound]')
    const off = await page.evaluate(() => localStorage.getItem('davidworld:sound'))
    check(off === 'off' && errors.length === 0, 'resting the box turns sound off, no errors')
    await page.close()
  }

  // ---- reduced motion: stays classic, enter-world skips intro ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const noAutoMount = !(await page.$('#desk-root canvas'))
    check(noAutoMount, 'reduced-motion visitors stay on classic by default')
    await page.click('#enter-world')
    await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
    await page.waitForTimeout(400)
    const noSkip = !(await page.$('.skip-intro'))
    check(noSkip, 'entering the world under reduced motion skips the intro')
    await ctx.close()
  }

  // ---- share card + CRT in the village ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
    // preset: unlocked, 4 of 5 quests done
    await page.evaluate(() => {
      localStorage.setItem('davidworld:unlocked', 'yes')
      localStorage.setItem('davidworld:quests', JSON.stringify(['passcode', 'record', 'library', 'letter']))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
    await page.keyboard.press('Enter')
    await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
    await page.keyboard.press('Enter')
    await page.waitForSelector('#village-root canvas', { timeout: 9000 })
    await page.waitForTimeout(400)
    // stand before the coffee machine, face it, and interact via a real event
    // (keyboard plumbing is proven by e2e-village; this test targets the card)
    await page.evaluate(() => {
      const v = window.__village.player
      v.tx = 37; v.ty = 7; v.px = 37 * 16; v.py = 7 * 16
      v.dir = [0, -1]
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
    })
    const share = await page.waitForSelector('.v-panel.win-all', { timeout: 8000 }).catch(() => null)
    if (share) {
      const dl = await page.$eval('.v-panel.win-all a[download]', el => el.href.slice(0, 22))
      check(dl.startsWith('data:image/png'), 'all five quests award the downloadable postcard')
      await page.screenshot({ path: 'shots/village-sharecard.png' })
      await page.click('[data-close-share]')
    } else check(false, 'share card appears after the final quest')
    // CRT toggle
    await page.keyboard.press('Escape')
    await page.waitForSelector('[data-crt]', { timeout: 3000 })
    await page.click('[data-crt]')
    const crt = await page.$eval('#village-root', el => el.classList.contains('crt'))
    check(crt, 'CRT scanlines toggle from the pause menu')
    await page.screenshot({ path: 'shots/village-crt.png' })
    await ctx.close()
  }

  await browser.close()
} finally {
  preview.kill()
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL CHECKS PASSED')
process.exit(failures ? 1 : 0)

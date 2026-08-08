import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('davidworld:unlocked', 'yes'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#village-root canvas', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/home/claude/davidworld/shots/peek-town.png' })
  await page.evaluate(() => window.__village.go('home'))
  await page.waitForTimeout(400)
  // stand mid-room facing the jersey wall side, so a label shows
  await page.evaluate(() => {
    const v = window.__village.player
    v.tx = 10; v.ty = 3; v.px = 10 * 16; v.py = 3 * 16; v.dir = [0, -1]
  })
  await page.waitForTimeout(250)
  await page.screenshot({ path: '/home/claude/davidworld/shots/peek-home.png' })
  console.log('errors:', errs.length ? errs : 'none')
  await browser.close()
} finally { preview.kill() }

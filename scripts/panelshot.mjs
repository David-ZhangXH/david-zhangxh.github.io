import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('davidworld:unlocked', 'yes'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#village-root canvas', { timeout: 15000 })
  await page.waitForTimeout(500)
  await page.evaluate(() => window.__village.go('home'))
  await page.waitForTimeout(300)
  await page.evaluate(() => {
    const v = window.__village.player
    v.tx = 2; v.ty = 3; v.px = 2 * 16; v.py = 3 * 16; v.dir = [0, -1]
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
  })
  await page.waitForSelector('.v-musicbox', { timeout: 5000 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/home/claude/davidworld/shots/village-musicbox.png' })
  await browser.close()
  console.log('shot ok')
} finally { preview.kill() }

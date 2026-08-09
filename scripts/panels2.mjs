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
  const open = async (x, y, dx, dy, shot) => {
    await page.evaluate(([x, y, dx, dy]) => {
      const v = window.__village.player
      v.tx = x; v.ty = y; v.px = x * 16; v.py = y * 16; v.dir = [dx, dy]
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }))
    }, [x, y, dx, dy])
    await page.waitForSelector('.v-panel', { timeout: 4000 })
    await page.waitForTimeout(250)
    await page.screenshot({ path: shot })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  await open(2, 4, -1, 0, 'shots/panel-worldmap.png')
  await open(9, 6, 0, 1, 'shots/panel-games.png')
  await open(7, 3, 0, -1, 'shots/panel-laptop.png')
  console.log('ok')
  await browser.close()
} finally { preview.kill() }

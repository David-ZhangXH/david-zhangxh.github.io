import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('davidworld:unlocked', 'yes'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 6000 })
  await page.keyboard.press('Enter')
  await page.focus('.hotspot-proxies button[data-hotspot="handheld"]')
  await page.keyboard.press('Enter')
  await page.waitForSelector('#village-root canvas', { timeout: 15000 })
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__village.go('home'))
  await page.waitForTimeout(200)
  await page.evaluate(() => {
    const pets = window.__village.cats
    const spots = [[2, 4], [11, 6], [3, 5], [7, 5]]
    pets.forEach((p, i) => { p.tx = spots[i][0]; p.ty = spots[i][1]; p.px = spots[i][0] * 16; p.py = spots[i][1] * 16; p.path = []; p.waitUntil = 1e9 })
    const v = window.__village.player; v.tx = 7; v.ty = 7; v.px = 112; v.py = 112
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'shots/pets-lineup.png' })
  await browser.close()
} finally { preview.kill() }

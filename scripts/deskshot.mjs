import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)))
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 8000 })
  await page.keyboard.press('Enter') // skip intro
  await page.waitForTimeout(2500)   // let textures load + settle
  await page.screenshot({ path: 'shots/studio-desk.png' })
  // zoom the photo frame: fly the frame pose
  await page.focus('.hotspot-proxies button[data-hotspot="frame"]')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1600)
  await page.screenshot({ path: 'shots/studio-frame.png' })
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none')
  await browser.close()
} finally { preview.kill() }

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errs = []
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)))
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 8000 })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2600)
  await page.mouse.move(60, 540); await page.waitForTimeout(900)
  await page.screenshot({ path: 'shots/alive-left.png' })
  await page.mouse.move(1860, 540); await page.waitForTimeout(900)
  await page.screenshot({ path: 'shots/alive-right.png' })
  // hover the mug → halo
  await page.mouse.move(600, 720); await page.waitForTimeout(700)
  await page.screenshot({ path: 'shots/alive-hover.png' })
  await page.mouse.move(960, 200); await page.waitForTimeout(600)
  await page.screenshot({ path: 'shots/alive-full.png' })
  console.log('errors:', errs.length ? errs : 'none')
  await browser.close()
} finally { preview.kill() }

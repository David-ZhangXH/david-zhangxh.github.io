import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 8000 })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2600)
  // parallax extremes: photo must stay glued to the painted frame
  await page.mouse.move(30, 30);   await page.waitForTimeout(900)
  await page.screenshot({ path: 'shots/frame-par-tl.png', clip: { x: 130, y: 700, width: 420, height: 300 } })
  await page.mouse.move(2530, 1410); await page.waitForTimeout(900)
  await page.screenshot({ path: 'shots/frame-par-br.png', clip: { x: 130, y: 700, width: 420, height: 300 } })
  await page.mouse.move(1280, 720); await page.waitForTimeout(900)
  await page.screenshot({ path: 'shots/studio-desk-final.png' })
  console.log('ok')
  await browser.close()
} finally { preview.kill() }

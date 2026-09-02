import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  // David's real-world case: 1920-wide browser viewport ≈ 2.03 aspect
  const page = await browser.newPage({ viewport: { width: 1920, height: 945 } })
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#desk-root canvas', { timeout: 8000 })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2200)
  await page.screenshot({ path: 'shots/desk-wide.png' })
  console.log('ok')
  await browser.close()
} finally { preview.kill() }

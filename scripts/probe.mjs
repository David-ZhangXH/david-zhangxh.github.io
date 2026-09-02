import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: '/home/claude/davidworld' })
await new Promise(r => setTimeout(r, 1800))
try {
  const browser = await chromium.launch({ executablePath: process.env.PW_EXE, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 400)))
  page.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0, 400)))
  page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
  page.on('requestfailed', r => console.log('FAILED', r.url(), r.failure()?.errorText))
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  console.log('canvas:', !!(await page.$('#desk-root canvas')))
  console.log('body classes:', await page.evaluate(() => document.body.className), '| classic visible:', await page.evaluate(() => !!document.querySelector('.classic') && getComputedStyle(document.querySelector('.classic')).display !== 'none'))
  console.log(await page.evaluate(() => [...document.querySelectorAll('script[type=module]')].map(s => s.src).join(',')))
  await browser.close()
} finally { preview.kill() }

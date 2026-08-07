// Screenshots the BUILT site (vite preview) at desktop + phone sizes.
// In the cloud workspace, set PW_EXE=/opt/pw-browsers/chromium (no download needed).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const exe = process.env.PW_EXE
const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 1800))

try {
  mkdirSync('shots', { recursive: true })
  const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {})
  for (const [name, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport })
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
    await page.screenshot({ path: `shots/classic-${name}.png`, fullPage: true })
    console.log(`shots/classic-${name}.png`)
  }
  await browser.close()
} finally {
  preview.kill()
}

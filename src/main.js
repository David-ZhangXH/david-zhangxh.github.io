// Boot + world router: classic is always complete; desk ⇄ galaxy mount on top.
import { webglAvailable, reducedMotion } from './core/capability.js'

const MODE_KEY = 'davidworld:mode'

function enhanceClassic() {
  const mail = document.querySelector('a[href^="mailto:"]')
  if (mail && navigator.clipboard) {
    mail.addEventListener('click', (e) => {
      e.preventDefault()
      const addr = mail.getAttribute('href').replace('mailto:', '')
      navigator.clipboard.writeText(addr).then(() => {
        const prev = mail.textContent
        mail.textContent = 'copied!'
        setTimeout(() => { mail.textContent = prev }, 1200)
      }).catch(() => { location.href = mail.getAttribute('href') })
    })
  }
}

let mounted = null

function veilOn() {
  const v = document.createElement('div')
  v.style.cssText = 'position:fixed;inset:0;background:#0a0f1e;z-index:40;display:flex;align-items:center;justify-content:center;color:#98a0b4;font:500 13px ui-monospace,monospace;letter-spacing:.18em'
  v.textContent = '23:47 — ENTERING'
  document.body.appendChild(v)
  return v
}

const WORLD_IMPORTS = {
  desk: () => import('./desk/index.js'),
  galaxy: () => import('./galaxy/index.js'),
  village: () => import('./village/index.js')
}

async function loadWorld(path) {
  return Promise.race([
    WORLD_IMPORTS[path](),
    new Promise((_, rej) => setTimeout(() => rej(new Error('world load timeout')), 5000))
  ])
}

function toClassic() {
  mounted = null
  window.__desk = null
  window.__galaxy = null
  window.__village = null
  localStorage.setItem(MODE_KEY, 'classic')
}

async function mountWorld(name, opts = {}) {
  const veil = veilOn()
  try {
    const backToDesk = () => { window.__galaxy = null; window.__village = null; mounted = null; mountWorld('desk', { skipIntro: true }) }
    if (name === 'desk') {
      const mod = await loadWorld('desk')
      mounted = mod.mountDesk({
        reducedMotion: reducedMotion(),
        skipIntro: !!opts.skipIntro,
        onExit: toClassic,
        onPortal: (kind) => {
          mounted?.unmount()
          window.__desk = null
          mounted = null
          mountWorld(kind)
        }
      })
      window.__desk = mounted
    } else if (name === 'galaxy') {
      const mod = await loadWorld('galaxy')
      mounted = mod.mountGalaxy({ onExit: backToDesk, onClassic: toClassic, reducedMotion: reducedMotion() })
      window.__galaxy = mounted
    } else {
      const mod = await loadWorld('village')
      mounted = mod.mountVillage({ onExit: backToDesk, onClassic: toClassic })
      window.__village = mounted
    }
    localStorage.setItem(MODE_KEY, 'world')
  } catch (err) {
    console.warn('[david.world] staying classic:', err.message)
    toClassic()
  } finally {
    veil.remove()
    // fade out any transition curtain a world left up for us
    document.querySelectorAll('.desk-veil').forEach((v) => {
      v.classList.add('hidden')
      setTimeout(() => v.remove(), 700)
    })
  }
}

function addEnterButton() {
  const nav = document.querySelector('.classic .links')
  if (!nav || document.getElementById('enter-world')) return
  const a = document.createElement('a')
  a.id = 'enter-world'
  a.href = '#'
  a.textContent = '✦ enter the world'
  a.addEventListener('click', (e) => { e.preventDefault(); mountWorld('desk') })
  nav.prepend(a)
}

function boot() {
  enhanceClassic()
  if (!webglAvailable()) return // classic only — quietly
  addEnterButton()
  const pref = localStorage.getItem(MODE_KEY)
  if (pref !== 'classic' && !reducedMotion()) mountWorld('desk')
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()

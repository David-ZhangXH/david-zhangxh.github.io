// The desk world: mount/unmount, interactions, camera, cards.
import * as THREE from 'three'
import { createScene } from './scene.js'
import { buildFurniture } from './furniture.js'
import { makeScreenTexture, makeRain, makeSteam, makeSmoke, lampFlicker } from './effects.js'
import { createDeskState, HOTSPOTS } from './state.js'
import { HOME, INTRO_START, POSES } from './poses.js'
import { aboutCard, cvCard, contactCard, linksCard, playlistCard, teaserCard, plantCard, keyboardCard, boardCard, microCard } from './cards.js'
import { createBoard, formatWhen } from '../core/board.js'
import boardConfig from '../../content/board.json'
import * as audio from '../core/audio.js'
import '../core/overlay.css'
import './desk.css'
import profile from '../../content/profile.json'
import playlist from '../../content/playlist.json'

const CARD_FOR = {
  monitor: () => teaserCard('galaxy'),
  handheld: () => teaserCard('village'),
  tray: () => cvCard() + contactCard(profile),
  frame: () => aboutCard(profile),
  notes: () => linksCard(profile),
  musicbox: () => playlistCard(playlist, audio.soundOn()),
  plant: () => plantCard(),
  keyboard: () => keyboardCard(),
  board: () => boardCard([], { loading: true }),
  mouse: () => microCard('The mouse', 'DPI 1600 * 0.23'),
  shelf: () => microCard('The bookshelves', 'nothing there...'),
  headphones: () => microCard('The headphones', 'Volume: 001')
}

const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

export function mountDesk({ reducedMotion = false, skipIntro = false, onExit, onPortal } = {}) {
  const previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  const root = document.createElement('div')
  root.id = 'desk-root'
  document.body.appendChild(root)

  const world = createScene(root)
  const grade = document.createElement('div')
  grade.className = 'desk-grade'
  root.appendChild(grade)
  const hud = document.createElement('div')
  hud.className = 'desk-hud'
  hud.innerHTML = `
    <div class="desk-mark"><span class="desk-mark__eyebrow">DAVID / WORLD 01</span><strong>THE DESK</strong></div>
    <div class="desk-weather"><span class="desk-weather__dot"></span>23:47 · RAIN OVER THE CITY</div>
    <div class="desk-panhint">← drag to look around →</div>`
  root.appendChild(hud)
  const { hotspots, screen, crank, mugTip, windowRegion, candle } = buildFurniture(world.scene)
  if (audio.soundOn()) audio.startProfile('desk')
  world.onTick((dt) => { if (audio.soundOn()) crank.rotation.x += dt * 1.6 })

  // ---- effects ----
  const board = createBoard(boardConfig)
  const screenFx = makeScreenTexture()
  screen.material = new THREE.MeshBasicMaterial({ map: screenFx.texture, toneMapped: false })
  const rain = makeRain(windowRegion)
  world.scene.add(rain.object)
  const steam = makeSteam(mugTip)
  world.scene.add(steam.object)
  const smoke = makeSmoke(candle.flameTip)
  world.scene.add(smoke.object)
  // the candle: lit by default, blown out with a click, relit with another
  let candleOn = true
  let candleLevel = 1          // 0 = dark, 1 = burning (eased)
  root.dataset.candle = 'on'
  function toggleCandle(now) {
    candleOn = !candleOn
    root.dataset.candle = candleOn ? 'on' : 'off'
    if (!candleOn) smoke.puff(now)
    else toast('Le Labo 25')
  }
  const flicker = lampFlicker(world.lampLight)
  let screenClock = 0
  world.onTick((dt, t) => {
    rain.update(dt)
    steam.update(dt, t)
    smoke.update(dt, t)
    flicker(dt, t)
    // candle: ease toward its state; while burning, a soft irregular flicker
    candleLevel += ((candleOn ? 1 : 0) - candleLevel) * Math.min(1, dt * (candleOn ? 2.2 : 5))
    const wobble = 0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 9.1) * Math.sin(t * 5.3 + 1.7))
    candle.lit.material.opacity = candleLevel * (0.88 + 0.12 * wobble)
    candle.glow.material.opacity = candle.glowBase * candleLevel * wobble
    candle.dim.material.opacity = 0.42 * (1 - candleLevel)
    screenClock += dt
    // The monitor is a living picture: smooth enough to notice, restrained
    // enough to remain ambient while the rest of the desk is explored.
    if (screenClock > 0.045) { screenClock = 0; screenFx.update(t) }
  })

  // ---- state + camera rig ----
  const state = createDeskState()
  const cam = world.camera
  const cur = { pos: new THREE.Vector3(...INTRO_START.pos), look: new THREE.Vector3(...INTRO_START.look) }
  let tween = null // {fromPos, fromLook, toPos, toLook, t, dur, then}
  const mouse = { x: 0, y: 0 }
  // narrow screens see a slice of the desk; a horizontal drag pans across it
  const pan = { x: 0, dragging: false, moved: false, startX: 0, startPan: 0 }
  const isNarrow = () => root.clientWidth / root.clientHeight < 1.6
  const halfVisible = () => 1.125 * Math.min(root.clientWidth / root.clientHeight, 4 / 2.25)  // world units at the art plane
  const panLimit = () => Math.max(0, 2 - halfVisible() - 0.02)

  function tweenTo(pose, dur, then) {
    tween = {
      fromPos: cur.pos.clone(), fromLook: cur.look.clone(),
      toPos: new THREE.Vector3(...pose.pos), toLook: new THREE.Vector3(...pose.look),
      start: undefined, dur, then
    }
  }

  world.onTick((dt, t) => {
    if (tween) {
      // wall-clock timing: tweens finish on schedule even at low frame rates
      if (tween.start === undefined) tween.start = t
      const k = ease(Math.min(1, (t - tween.start) / tween.dur))
      cur.pos.lerpVectors(tween.fromPos, tween.toPos, k)
      cur.look.lerpVectors(tween.fromLook, tween.toLook, k)
      if (t - tween.start >= tween.dur) { const fn = tween.then; tween = null; fn && fn() }
    }
    // parallax only at rest, damped
    const portrait = root.clientWidth / root.clientHeight < 0.8
    const px = state.get().mode === 'idle' && !tween ? mouse.x * (portrait ? 0.34 : 0.08) : 0
    const py = state.get().mode === 'idle' && !tween ? mouse.y * (portrait ? 0.10 : 0.05) : 0
    const atHome = state.get().mode === 'idle' && !tween
    if (!atHome && !pan.dragging) pan.x += (0 - pan.x) * Math.min(1, dt * 4)
    pan.x = Math.max(-panLimit(), Math.min(panLimit(), pan.x))
    const ox = atHome ? pan.x : 0
    cam.position.set(cur.pos.x + px + ox, cur.pos.y - py, cur.pos.z)
    cam.lookAt(cur.look.x + ox, cur.look.y, cur.look.z)
  })

  // ---- intro ----
  const veil = document.createElement('div')
  veil.className = 'desk-veil'
  veil.textContent = '23:47 — ENTERING'
  document.body.appendChild(veil)
  const endIntro = () => {
    if (state.get().mode !== 'intro') return
    tween = null
    cur.pos.set(...HOME.pos); cur.look.set(...HOME.look)
    state.finishIntro()
    skipBtn.remove()
  }
  const skipBtn = document.createElement('button')
  skipBtn.className = 'corner-btn skip-intro'
  skipBtn.textContent = 'skip ↵'
  skipBtn.addEventListener('click', endIntro)
  requestAnimationFrame(() => {
    veil.classList.add('hidden')
    setTimeout(() => veil.remove(), 700)
  })
  if (reducedMotion || skipIntro) {
    endIntro()
  } else {
    document.body.appendChild(skipBtn)
    tweenTo(HOME, 4, () => { state.finishIntro(); skipBtn.remove() })
  }
  const introKey = (e) => { if (e.key === 'Enter') endIntro() }
  window.addEventListener('keydown', introKey)

  // ---- pointer interactions ----
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const hitList = Object.entries(hotspots).map(([id, h]) => { h.hit.userData.id = id; return h.hit })
  const tooltip = document.createElement('div')
  tooltip.className = 'desk-tooltip'
  document.body.appendChild(tooltip)
  let hovered = null

  function pick(clientX, clientY) {
    ndc.set((clientX / root.clientWidth) * 2 - 1, -(clientY / root.clientHeight) * 2 + 1)
    ray.setFromCamera(ndc, cam)
    const hit = ray.intersectObjects(hitList, false)[0]
    return hit ? hit.object.userData.id : null
  }

  root.addEventListener('pointermove', (e) => {
    if (pan.dragging && pan.moved) root.classList.add('has-panned')
    mouse.x = (e.clientX / root.clientWidth) * 2 - 1
    mouse.y = (e.clientY / root.clientHeight) * 2 - 1
    const id = state.get().mode === 'idle' ? pick(e.clientX, e.clientY) : null
    if (id !== hovered) {
      hovered = id
      root.classList.toggle('is-discovering', !!id)
      root.style.cursor = id ? 'pointer' : 'default'
      tooltip.classList.toggle('on', !!id)
      if (id) tooltip.textContent = hotspots[id].label
    }
  })

  function activate(id) {
    const st = state.get()
    if (st.mode === 'intro') { endIntro(); return }
    if (id === 'mug') { steam.heartBurst(worldTime); return }
    if (id === 'candle') { toggleCandle(worldTime); return }
    if (st.mode !== 'idle') return
    root.classList.add('has-explored')
    if (id === 'monitor' && onPortal) { dive('galaxy', POSES.monitor, { pos: [-0.18, 0.33, -0.48], look: [-0.18, 0.33, -1] }); return }
    if (id === 'handheld' && onPortal) { dive('village', POSES.handheld, { pos: [1.26, -0.21, -0.48], look: [1.26, -0.21, -1] }); return }
    state.focus(id)
    tooltip.classList.remove('on')
    tweenTo(POSES[id], reducedMotion ? 0.01 : 0.7, () => openCard(id))
  }

  // portals: fly into the object, then hand the router the destination
  function dive(kind, approach, DIVE) {
    state.focus(kind === 'galaxy' ? 'monitor' : 'handheld')
    tooltip.classList.remove('on')
    const dur = reducedMotion ? 0.01 : 0.7
    tweenTo(approach, dur, () => {
      const fade = document.createElement('div')
      fade.className = 'desk-veil hidden'
      fade.textContent = ''
      document.body.appendChild(fade)
      requestAnimationFrame(() => fade.classList.remove('hidden'))
      // the fade stays up — the router unmounts us and clears veils once the
      // next world is ready, so the cut happens behind the curtain
      tweenTo(DIVE, reducedMotion ? 0.01 : 0.9, () => {
        setTimeout(() => onPortal(kind), reducedMotion ? 0 : 250)
      })
    })
  }
  let worldTime = 0
  world.onTick((dt, t) => { worldTime = t })

  root.addEventListener('pointerdown', (e) => {
    if (!isNarrow() || state.get().mode !== 'idle') return
    pan.dragging = true; pan.moved = false; pan.startX = e.clientX; pan.startPan = pan.x
  })
  root.addEventListener('pointermove', (e) => {
    if (!pan.dragging) return
    const dx = e.clientX - pan.startX
    if (Math.abs(dx) > 8) pan.moved = true
    pan.x = pan.startPan - dx / root.clientWidth * halfVisible() * 2
  })
  const endDrag = () => { pan.dragging = false }
  root.addEventListener('pointerup', endDrag)
  root.addEventListener('pointercancel', endDrag)
  root.addEventListener('click', (e) => {
    if (pan.moved) { pan.moved = false; return }   // that was a drag, not a tap
    const st = state.get()
    if (st.mode === 'intro') { endIntro(); return }
    if (st.mode !== 'idle') return
    const id = pick(e.clientX, e.clientY)
    if (id) activate(id)
  })

  // ---- keyboard proxies ----
  const proxies = document.createElement('nav')
  proxies.className = 'hotspot-proxies'
  proxies.setAttribute('aria-label', 'Desk objects')
  for (const id of HOTSPOTS) {
    const b = document.createElement('button')
    b.dataset.hotspot = id
    b.textContent = hotspots[id].label
    b.setAttribute('aria-label', hotspots[id].label)
    b.addEventListener('click', () => activate(id))
    proxies.appendChild(b)
  }
  document.body.appendChild(proxies)

  // ---- cards ----
  let backdrop = null
  function openCard(id) {
    const make = CARD_FOR[id]
    if (!make) return
    backdrop = document.createElement('div')
    backdrop.className = 'card-backdrop'
    backdrop.innerHTML = `<div class="card-shell">${make()}</div>`
    const shell = backdrop.firstElementChild
    const close = document.createElement('button')
    close.className = 'card-close'
    close.setAttribute('aria-label', 'Close')
    close.textContent = '×'
    shell.querySelector('.card').appendChild(close)
    close.addEventListener('click', closeCard)
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeCard() })
    backdrop.querySelectorAll('[data-pin-board]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const input = backdrop.querySelector('.wall-input')
        const text = input?.value.trim()
        if (!text) { input?.focus(); return }
        btn.disabled = true
        btn.textContent = 'pinning…'
        await board.add(text)
        closeCard()
        toast('pinned to the board ✓')
      })
    })
    if (id === 'board') {
      const own = backdrop
      board.list().then(({ messages, shared, offline, reason }) => {
        if (backdrop !== own) return
        const cardEl = own.querySelector('.card')
        if (!cardEl) return
        const html = boardCard(messages.map(m => ({ ...m, when: formatWhen(m.at) })), { shared, offline, reason })
        const fresh = document.createElement('div'); fresh.innerHTML = html
        const body = fresh.firstElementChild
        cardEl.querySelectorAll(':scope > *:not(.card-close)').forEach(n => n.remove())
        while (body.firstChild) cardEl.insertBefore(body.firstChild, cardEl.querySelector('.card-close'))
      })
    }
    backdrop.querySelectorAll('[data-sound]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const on = audio.toggle('desk')
        btn.textContent = on ? '🔇 let the box rest' : '🎶 wind the box'
      })
    })
    backdrop.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
          btn.textContent = 'copied!'
          setTimeout(() => { btn.textContent = 'copy address' }, 1200)
        })
      })
    })
    document.body.appendChild(backdrop)
    close.focus()
  }
  let toastTimer = 0
  function toast(text) {
    let el = root.querySelector('.desk-toast')
    if (!el) { el = document.createElement('div'); el.className = 'desk-toast'; root.appendChild(el) }
    el.textContent = text
    el.classList.add('on')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => el.classList.remove('on'), 2200)
  }
  function closeCard() {
    backdrop?.remove(); backdrop = null
    state.close()
    tweenTo(HOME, reducedMotion ? 0.01 : 0.7)
  }
  const escKey = (e) => { if (e.key === 'Escape' && state.get().mode === 'focus') closeCard() }
  window.addEventListener('keydown', escKey)

  // ---- classic escape hatch ----
  const toggle = document.createElement('button')
  toggle.id = 'classic-toggle'
  toggle.className = 'corner-btn'
  toggle.textContent = '☰ classic site'
  toggle.addEventListener('click', () => { unmount(); onExit?.() })
  document.body.appendChild(toggle)

  world.start()

  function unmount() {
    document.documentElement.style.overflow = previousOverflow
    audio.stopAll()
    window.removeEventListener('keydown', escKey)
    window.removeEventListener('keydown', introKey)
    backdrop?.remove()
    tooltip.remove(); proxies.remove(); toggle.remove(); skipBtn.remove(); veil.remove()
    world.dispose()
    root.remove()
  }
  return { unmount, state }
}

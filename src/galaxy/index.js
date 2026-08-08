// The galaxy world: drift among your works, read them in orbit, find the secret.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createEngine } from '../core/engine.js'
import { buildBodies } from './bodies.js'
import { makeStarfield, makeShootingStars } from './effects.js'
import { createGalaxyState } from './state.js'
import { workCard, ideasCard } from './cards.js'
import * as audio from '../core/audio.js'
import '../core/overlay.css'
import './galaxy.css'
import works from '../../content/works.json'
import ideas from '../../content/ideas.json'
import profile from '../../content/profile.json'

const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

export function mountGalaxy({ onExit, onClassic, reducedMotion = false } = {}) {
  const root = document.createElement('div')
  root.id = 'galaxy-root'
  document.body.appendChild(root)

  const engine = createEngine(root, {
    background: 0x04060f,
    fovFor: (aspect) => (aspect < 0.8 ? 72 : 55)
  })
  const { scene, camera } = engine
  camera.position.set(0, 1.4, 7)

  const grade = document.createElement('div')
  grade.className = 'galaxy-grade'
  root.appendChild(grade)

  if (audio.soundOn()) audio.startProfile('galaxy')

  scene.add(makeStarfield())
  const bodies = buildBodies(scene, works)
  const shooting = makeShootingStars(scene)
  engine.onTick((dt, t) => { bodies.update(dt, t); shooting.update(dt, t) })

  const ids = Object.keys(bodies.registry)
  const state = createGalaxyState(ids)

  // ---- controls ----
  const controls = new OrbitControls(camera, engine.renderer.domElement)
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 2.2
  controls.maxDistance = 11
  controls.autoRotate = !reducedMotion
  controls.autoRotateSpeed = 0.35
  let lastT = 0
  let calmUntil = 0
  controls.addEventListener('start', () => { calmUntil = Infinity })
  controls.addEventListener('end', () => { calmUntil = lastT + 8 })
  engine.onTick((dt, t) => {
    lastT = t
    controls.autoRotate = !reducedMotion && state.get().mode === 'drift' && t > calmUntil
    controls.update()
  })

  // ---- focus tweens (wall-clock, like the desk) ----
  let tween = null
  let savedPose = null
  engine.onTick((dt, t) => {
    if (tween) {
      if (tween.start === undefined) tween.start = t
      const k = ease(Math.min(1, (t - tween.start) / tween.dur))
      camera.position.lerpVectors(tween.fromPos, tween.toPos, k)
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k)
      if (t - tween.start >= tween.dur) { const fn = tween.then; tween = null; fn && fn() }
    }
  })
  function tweenTo(pos, target, dur, then) {
    tween = {
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toPos: pos.clone(), toTarget: target.clone(), start: undefined, dur, then
    }
  }

  // ---- picking ----
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const hitList = ids.map(id => bodies.registry[id].hit)
  const tooltip = document.createElement('div')
  tooltip.className = 'desk-tooltip'
  document.body.appendChild(tooltip)
  let hovered = null

  function pick(x, y) {
    ndc.set((x / root.clientWidth) * 2 - 1, -(y / root.clientHeight) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(hitList, false)[0]
    return hit ? hit.object.userData.id : null
  }

  root.addEventListener('pointermove', (e) => {
    if (state.get().mode !== 'drift') return
    const id = pick(e.clientX, e.clientY)
    if (id !== hovered) {
      hovered = id
      root.style.cursor = id ? 'pointer' : 'default'
      tooltip.classList.toggle('on', !!id)
      if (id) tooltip.textContent = id === 'secret' ? '…' : bodies.registry[id].work.title
      for (const bid of ids) {
        const l = bodies.registry[bid].label
        if (l) l.material.opacity = bid === id ? 1 : l.userData.baseOpacity
      }
    }
  })

  let downAt = null
  root.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY] })
  root.addEventListener('pointerup', (e) => {
    // only treat as a click if the pointer barely moved (don't fight orbit drags)
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return
    if (state.get().mode !== 'drift') return
    const id = pick(e.clientX, e.clientY)
    if (id) approach(id)
  })

  function approach(id) {
    if (state.get().mode !== 'drift') return
    state.focus(id)
    tooltip.classList.remove('on')
    controls.enabled = false
    savedPose = { pos: camera.position.clone(), target: controls.target.clone() }
    const bodyPos = bodies.registry[id].hit.position.clone()
    const dir = camera.position.clone().sub(bodyPos).normalize()
    const dist = id === 'secret' ? 2.4 : 1.9
    tweenTo(bodyPos.clone().addScaledVector(dir, dist), bodyPos, reducedMotion ? 0.01 : 0.9, () => openCard(id))
  }

  // ---- cards ----
  let backdrop = null
  function openCard(id) {
    const html = id === 'secret' ? ideasCard(ideas, profile.email) : workCard(bodies.registry[id].work)
    backdrop = document.createElement('div')
    backdrop.className = 'card-backdrop'
    backdrop.innerHTML = html
    const close = document.createElement('button')
    close.className = 'card-close'
    close.setAttribute('aria-label', 'Close')
    close.textContent = '×'
    backdrop.querySelector('.card').appendChild(close)
    close.addEventListener('click', release)
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) release() })
    backdrop.querySelectorAll('[data-send-idea]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = backdrop.querySelector('.idea-input')?.value.trim()
        if (!text) return
        location.href = `mailto:${btn.dataset.email}?subject=${encodeURIComponent('An idea for the nebula')}&body=${encodeURIComponent(text)}`
      })
    })
    document.body.appendChild(backdrop)
    close.focus()
  }
  function release() {
    backdrop?.remove(); backdrop = null
    state.close()
    if (savedPose) tweenTo(savedPose.pos, savedPose.target, reducedMotion ? 0.01 : 0.9, () => { controls.enabled = true })
    else controls.enabled = true
  }
  const escKey = (e) => {
    if (e.key !== 'Escape') return
    if (state.get().mode === 'focus') release()
    else exit()
  }
  window.addEventListener('keydown', escKey)

  // ---- keyboard proxies (a11y — the secret stays cryptic, not hidden) ----
  const proxies = document.createElement('nav')
  proxies.className = 'hotspot-proxies'
  proxies.setAttribute('aria-label', 'Celestial bodies')
  for (const id of ids) {
    const b = document.createElement('button')
    b.dataset.body = id
    const label = id === 'secret'
      ? '…something drifts at the edge of the sky'
      : bodies.registry[id].work.title
    b.textContent = label
    b.setAttribute('aria-label', label)
    b.addEventListener('click', () => approach(id))
    proxies.appendChild(b)
  }
  document.body.appendChild(proxies)

  // ---- exits ----
  const back = document.createElement('button')
  back.id = 'back-desk'
  back.className = 'corner-btn'
  back.textContent = '⌫ back to desk'
  back.addEventListener('click', exit)
  document.body.appendChild(back)

  const classicBtn = document.createElement('button')
  classicBtn.id = 'galaxy-classic'
  classicBtn.className = 'corner-btn'
  classicBtn.textContent = '☰ classic site'
  classicBtn.addEventListener('click', () => { unmount(); onClassic?.() })
  document.body.appendChild(classicBtn)

  function exit() { unmount(); onExit?.() }

  engine.start()

  function unmount() {
    audio.stopAll()
    window.removeEventListener('keydown', escKey)
    backdrop?.remove()
    tooltip.remove(); proxies.remove(); back.remove(); classicBtn.remove()
    controls.dispose()
    engine.dispose()
    root.remove()
  }
  return { unmount, state, bodyIds: ids }
}

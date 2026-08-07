// Galaxy visual vocabulary: glows, labels, starfield, particle clouds, shooting stars.
import * as THREE from 'three'
import { glowTexture, glowSprite } from '../core/glow.js'
export { glowTexture, glowSprite }

const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

export function labelSprite(text, { color = '#c9d0e0', opacity = 0.55, scale = 1, italic = false } = {}) {
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  const font = `${italic ? 'italic ' : ''}500 26px ui-monospace, Menlo, monospace`
  g.font = font
  const w = Math.ceil(g.measureText(text).width) + 20
  c.width = w; c.height = 40
  g.font = font
  g.fillStyle = color
  g.textBaseline = 'middle'
  g.fillText(text, 10, 22)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false })
  const s = new THREE.Sprite(mat)
  s.scale.set((w / 40) * 0.28 * scale, 0.28 * scale, 1)
  s.userData.baseOpacity = opacity
  return s
}

export function makeStarfield() {
  const group = new THREE.Group()
  const N = 1500
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const r = 20 + prand(i) * 10
    const th = prand(i + 500) * Math.PI * 2
    const ph = Math.acos(2 * prand(i + 1000) - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.cos(ph)
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xcfe6ff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false
  }))
  group.add(stars)
  const haze1 = glowSprite(0x2a3a6a, 26, 0.10); haze1.position.set(-9, 3, -14); group.add(haze1)
  const haze2 = glowSprite(0x4a2a5a, 22, 0.08); haze2.position.set(10, -4, -12); group.add(haze2)
  return group
}

export function particleCloud({ count = 160, radius = 0.7, flatten = 0.55, color = 0x7ddeb0, size = 0.035, opacity = 0.75, seed = 0 }) {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = Math.pow(prand(i + seed), 0.6) * radius
    const th = prand(i + seed + 300) * Math.PI * 2
    const ph = Math.acos(2 * prand(i + seed + 600) - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.cos(ph) * flatten
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, map: glowTexture(), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  }))
}

export function makeShootingStars(scene) {
  let active = null
  let nextAt = 8 // first delight arrives early; spec cadence afterwards
  function spawn(t) {
    const from = new THREE.Vector3((prand(t) - 0.5) * 24, 6 + prand(t + 1) * 4, -10 - prand(t + 2) * 6)
    const dir = new THREE.Vector3(0.7 + prand(t + 3) * 0.4, -0.5, 0.25).normalize()
    const head = glowSprite(0xffffff, 0.5, 0.95)
    head.position.copy(from)
    const trailGeo = new THREE.BufferGeometry().setFromPoints([from, from])
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
      color: 0xcfe6ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending
    }))
    scene.add(head, trail)
    active = { head, trail, from, dir, born: t, life: 1.4 }
  }
  function update(dt, t) {
    if (!active && t > nextAt) spawn(t)
    if (active) {
      const age = t - active.born
      const d = age * 14
      active.head.position.copy(active.from).addScaledVector(active.dir, d)
      const tailPos = active.head.position.clone().addScaledVector(active.dir, -Math.min(3, d))
      active.trail.geometry.setFromPoints([tailPos, active.head.position])
      const k = 1 - age / active.life
      active.head.material.opacity = 0.95 * Math.max(0, k)
      active.trail.material.opacity = 0.7 * Math.max(0, k)
      if (age > active.life) {
        scene.remove(active.head, active.trail)
        active.head.material.dispose(); active.trail.geometry.dispose(); active.trail.material.dispose()
        active = null
        nextAt = t + 60 + prand(t) * 60 // every 90s ± 30s
      }
    }
  }
  return { update }
}

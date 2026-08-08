// Living details: the monitor's starfield, rain behind the window, mug steam
// (with the heart easter egg), and lamp flicker.
import * as THREE from 'three'

// deterministic pseudo-random (stable scenes, resumable renders)
const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

export function makeScreenTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 320
  const g = c.getContext('2d')
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: prand(i) * 512, y: prand(i + 100) * 320, r: 0.6 + prand(i + 200) * 1.6, p: prand(i + 300)
  }))
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace

  // visitor words, typed across the screen (kept for their next visit)
  let typed = null // { text, start }
  let kept = ''
  try { kept = localStorage.getItem('davidworld:typed') || '' } catch {}

  const wrap = (text, max = 34) => {
    const words = text.split(/\s+/)
    const lines = ['']
    for (const w of words) {
      if ((lines[lines.length - 1] + ' ' + w).trim().length > max) lines.push(w)
      else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim()
    }
    return lines.slice(0, 5)
  }

  function draw(t) {
    const grad = g.createLinearGradient(0, 0, 0, 320)
    grad.addColorStop(0, '#0b1a33'); grad.addColorStop(1, '#07101f')
    g.fillStyle = grad; g.fillRect(0, 0, 512, 320)
    const neb = (x, y, r, color) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r)
      rg.addColorStop(0, color); rg.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    neb(150, 120, 90, 'rgba(107,229,255,0.10)')
    neb(390, 210, 80, 'rgba(255,107,213,0.09)')
    for (const s of stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.4 + s.p * 6.28))
      g.fillStyle = `rgba(207,230,255,${tw.toFixed(2)})`
      g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill()
    }
    g.fillStyle = '#dff8ff'
    g.beginPath(); g.arc(150, 118, 3.4, 0, 7); g.fill()

    if (typed) {
      const shown = typed.text.slice(0, Math.floor((t - typed.start) / 0.055))
      g.font = '22px monospace'
      g.fillStyle = 'rgba(223,248,255,0.95)'
      wrap(shown).forEach((line, i) => g.fillText(line, 40, 150 + i * 28))
      if (shown.length >= typed.text.length && t - typed.start > typed.text.length * 0.055 + 6) {
        typed = null // rest again after a while; the words stay kept
      }
    } else if (kept) {
      g.font = '15px monospace'
      g.fillStyle = 'rgba(159,196,255,0.5)'
      g.fillText(wrap(kept, 48)[0] || '', 40, 44)
    }

    g.font = '20px monospace'
    g.fillStyle = 'rgba(107,229,255,0.95)'
    const cursor = Math.floor(t * 2) % 2 ? '▌' : ' '
    g.fillText(`enter the galaxy ↵ ${cursor}`, 130, 288)
    tex.needsUpdate = true
  }
  draw(0)
  return {
    texture: tex,
    update: draw,
    typing: () => !!typed,
    typeText(text, t) {
      typed = { text: text.slice(0, 160), start: t }
      kept = typed.text
      try { localStorage.setItem('davidworld:typed', kept) } catch {}
    }
  }
}

export function makeRain(region) {
  const N = 110
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(N * 2 * 3)
  const seeds = []
  for (let i = 0; i < N; i++) {
    seeds.push({
      x: region.x + (prand(i) - 0.5) * region.w * 1.4,
      y: region.y + (prand(i + 50) - 0.5) * region.h * 1.8,
      z: region.z - prand(i + 90) * 0.6,
      v: 1.6 + prand(i + 130) * 1.2
    })
  }
  const mat = new THREE.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.45 })
  const lines = new THREE.LineSegments(geo, mat)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

  function update(dt) {
    for (let i = 0; i < N; i++) {
      const s = seeds[i]
      s.y -= s.v * dt
      const top = region.y + region.h
      if (s.y < region.y - region.h) s.y = top
      const o = i * 6
      pos[o] = s.x; pos[o + 1] = s.y; pos[o + 2] = s.z
      pos[o + 3] = s.x - 0.008; pos[o + 4] = s.y - 0.05; pos[o + 5] = s.z
    }
    geo.attributes.position.needsUpdate = true
  }
  update(0)
  return { object: lines, update }
}

// Parametric heart, scaled to hover above the mug.
function heartPoints(n, center, scale) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push(new THREE.Vector3(center.x + x * scale, center.y + 0.16 + y * scale, center.z))
  }
  return pts
}

export function makeSteam(origin) {
  const N = 42
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(N * 3)
  const parts = Array.from({ length: N }, (_, i) => ({
    life: prand(i) * 1.0,
    speed: 0.10 + prand(i + 30) * 0.08,
    drift: (prand(i + 60) - 0.5) * 0.05,
    phase: prand(i + 80) * 6.28
  }))
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  // round, soft particle sprite
  const pc = document.createElement('canvas')
  pc.width = pc.height = 32
  const pg = pc.getContext('2d')
  const rg = pg.createRadialGradient(16, 16, 0, 16, 16, 16)
  rg.addColorStop(0, 'rgba(255,255,255,1)')
  rg.addColorStop(0.5, 'rgba(255,255,255,.55)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  pg.fillStyle = rg
  pg.fillRect(0, 0, 32, 32)
  const spriteTex = new THREE.CanvasTexture(pc)
  const mat = new THREE.PointsMaterial({
    color: 0xdfe8ff, size: 0.018, map: spriteTex, transparent: true,
    opacity: 0.4, depthWrite: false
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false

  let heartUntil = -1
  let heartTargets = null

  function heartBurst(now) {
    heartUntil = now + 3.2
    heartTargets = heartPoints(N, origin, 0.0065)
  }
  const steamColor = new THREE.Color(0xdfe8ff)
  const heartColor = new THREE.Color(0xff6b8a)

  function update(dt, t) {
    const inHeart = t < heartUntil
    for (let i = 0; i < N; i++) {
      const p = parts[i]
      const o = i * 3
      if (inHeart && heartTargets) {
        // ease particles onto the heart outline
        pos[o] += (heartTargets[i].x - pos[o]) * Math.min(1, dt * 6)
        pos[o + 1] += (heartTargets[i].y - pos[o + 1]) * Math.min(1, dt * 6)
        pos[o + 2] += (heartTargets[i].z - pos[o + 2]) * Math.min(1, dt * 6)
      } else {
        p.life += dt * p.speed * 6
        if (p.life > 1) p.life = 0
        const y = p.life * 0.22
        pos[o] = origin.x + Math.sin(p.phase + p.life * 7) * 0.012 + p.drift * p.life
        pos[o + 1] = origin.y + y
        pos[o + 2] = origin.z + Math.cos(p.phase + p.life * 5) * 0.008
      }
    }
    mat.opacity = inHeart ? 0.9 : 0.4
    mat.size = inHeart ? 0.024 : 0.018
    mat.color.lerp(inHeart ? heartColor : steamColor, Math.min(1, dt * 5))
    geo.attributes.position.needsUpdate = true
  }
  update(0.016, 0)
  return { object: points, update, heartBurst }
}

export function lampFlicker(light, base = light.intensity) {
  let next = 2
  return (dt, t) => {
    if (t > next) {
      next = t + 1.5 + prand(Math.floor(t * 7)) * 4
      light.intensity = base * (0.92 + prand(Math.floor(t * 13)) * 0.1)
    } else {
      light.intensity += (base - light.intensity) * dt * 2
    }
  }
}

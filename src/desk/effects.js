// Living details: the monitor's starfield, rain behind the window, mug steam
// (with the heart easter egg), and lamp flicker.
import * as THREE from 'three'

// deterministic pseudo-random (stable scenes, resumable renders)
const prand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

export function makeScreenTexture() {
  const c = document.createElement('canvas')
  c.width = 768; c.height = 480
  const g = c.getContext('2d')
  const dust = Array.from({ length: 14 }, (_, i) => ({
    x: prand(i) * c.width,
    y: prand(i + 100) * c.height,
    r: 0.35 + prand(i + 200) * 0.45,
    p: prand(i + 300),
    speed: 1.2 + prand(i + 400) * 2.4
  }))
  const backdrop = new Image()
  backdrop.decoding = 'async'
  backdrop.src = 'images/galaxy-monitor.jpg'
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter

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
    g.fillStyle = '#020713'
    g.fillRect(0, 0, c.width, c.height)

    if (backdrop.complete && backdrop.naturalWidth) {
      const zoom = 1.075 + Math.sin(t * 0.34) * 0.012
      const scale = Math.max(c.width / backdrop.naturalWidth, c.height / backdrop.naturalHeight) * zoom
      const w = backdrop.naturalWidth * scale
      const h = backdrop.naturalHeight * scale
      const driftX = Math.sin(t * 0.28) * 15
      const driftY = Math.cos(t * 0.19) * 8
      const imageX = (c.width - w) / 2 + driftX
      const imageY = (c.height - h) / 2 + driftY
      g.drawImage(backdrop, imageX, imageY, w, h)

      // The portal region breathes independently from the slow camera drift.
      // The clipped second pass is intentionally subtle, like a living photo.
      g.save()
      g.beginPath()
      g.ellipse(c.width * 0.63, c.height * 0.43, c.width * 0.28, c.height * 0.25, 0, 0, Math.PI * 2)
      g.clip()
      g.globalCompositeOperation = 'screen'
      g.globalAlpha = 0.14 + Math.sin(t * 0.8) * 0.035
      const breathe = 1.022 + Math.sin(t * 0.55) * 0.012
      const liveW = w * breathe
      const liveH = h * breathe
      g.translate(c.width * 0.64, c.height * 0.43)
      g.rotate(t * 0.012)
      g.translate(-c.width * 0.64, -c.height * 0.43)
      g.drawImage(backdrop, (c.width - liveW) / 2 + driftX * 1.35, (c.height - liveH) / 2 + driftY * 1.2, liveW, liveH)
      g.restore()

      const pulse = 0.13 + Math.sin(t * 1.05) * 0.035
      const portal = g.createRadialGradient(c.width * 0.64, c.height * 0.43, 3, c.width * 0.64, c.height * 0.43, 92)
      portal.addColorStop(0, `rgba(91,225,255,${pulse})`)
      portal.addColorStop(0.42, `rgba(69,145,255,${(pulse * 0.45).toFixed(3)})`)
      portal.addColorStop(1, 'rgba(44,70,190,0)')
      g.fillStyle = portal
      g.fillRect(0, 0, c.width, c.height)
    } else {
      const fallback = g.createRadialGradient(505, 245, 5, 505, 245, 310)
      fallback.addColorStop(0, '#155b88')
      fallback.addColorStop(0.32, '#101f50')
      fallback.addColorStop(0.7, '#080d25')
      fallback.addColorStop(1, '#020713')
      g.fillStyle = fallback
      g.fillRect(0, 0, c.width, c.height)
    }

    // A few dim dust motes add life without turning the display into a
    // screensaver-like field of bright dots.
    for (const mote of dust) {
      const twinkle = 0.10 + 0.18 * Math.abs(Math.sin(t * 0.7 + mote.p * 6.28))
      g.fillStyle = `rgba(149,203,255,${twinkle.toFixed(2)})`
      g.beginPath()
      const liveX = (mote.x + t * mote.speed) % c.width
      const liveY = mote.y + Math.sin(t * 0.35 + mote.p * 6.28) * 3
      g.arc(liveX, liveY, mote.r, 0, Math.PI * 2)
      g.fill()
    }

    const vignette = g.createRadialGradient(c.width * 0.55, c.height * 0.46, 90, c.width * 0.5, c.height * 0.5, 520)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,3,12,0.62)')
    g.fillStyle = vignette
    g.fillRect(0, 0, c.width, c.height)

    const lowerShade = g.createLinearGradient(0, c.height * 0.62, 0, c.height)
    lowerShade.addColorStop(0, 'rgba(2,7,19,0)')
    lowerShade.addColorStop(1, 'rgba(2,7,19,0.72)')
    g.fillStyle = lowerShade
    g.fillRect(0, 0, c.width, c.height)

    if (typed) {
      const shown = typed.text.slice(0, Math.floor((t - typed.start) / 0.055))
      g.font = '24px ui-monospace, monospace'
      g.fillStyle = 'rgba(223,248,255,0.95)'
      wrap(shown).forEach((line, i) => g.fillText(line, 60, 220 + i * 34))
      if (shown.length >= typed.text.length && t - typed.start > typed.text.length * 0.055 + 6) {
        typed = null // rest again after a while; the words stay kept
      }
    } else if (kept) {
      g.font = '17px ui-monospace, monospace'
      g.fillStyle = 'rgba(159,196,255,0.5)'
      g.fillText(wrap(kept, 48)[0] || '', 54, 55)
    }

    g.save()
    g.textAlign = 'center'
    g.font = '600 24px ui-monospace, monospace'
    g.fillStyle = 'rgba(132,231,255,0.90)'
    g.shadowColor = 'rgba(75,201,255,0.55)'
    g.shadowBlur = 12
    const cursor = Math.floor(t * 2) % 2 ? '▌' : ' '
    g.fillText(`enter  ↵  ${cursor}`, c.width / 2, c.height - 45)
    g.restore()
    tex.needsUpdate = true
  }
  backdrop.addEventListener('load', () => draw(performance.now() / 1000), { once: true })
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
